/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from 'react'
import './App.css'
import moment from 'moment'
import client, { translate as t, useStrings } from '@doubledutch/admin-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import { mapPerUserPrivateAdminablePushedDataToObjectOfStateObjects } from '@doubledutch/firebase-connector'
import { HashRouter as Router, Redirect, Route } from 'react-router-dom'
import i18n from './i18n'
import 'react-tabs/style/react-tabs.css'

import SurveyWrapper from './SurveyWrapper'
import SurveyEditor from './SurveyEditor'
import SurveyResults from './SurveyResults'
import '@doubledutch/react-components/lib/base.css'
import 'survey-react/survey.css'
import 'bootstrap/dist/css/bootstrap.css'
import $ from 'jquery'
import 'jquery-ui/ui/widgets/datepicker.js'
import 'select2/dist/js/select2.js'
import 'jquery-bar-rating'

useStrings(i18n)

class App extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      surveys: [],
      surveysDraft: [],
      results: [],
      config: '',
      configKey: '',
      isSurveysBoxDisplay: true,
      isEditorBoxDisplay: true,
      isResultsBoxDisplay: true,
      showBuilder: false,
      search: '',
    }
    this.signin = props.fbc
      .signinAdmin()
      .then(user => (this.user = user))
      .catch(err => console.error(err))
  }

  componentDidMount() {
    const { fbc } = this.props
    this.signin.then(() => {
      client.getAttendees().then(users => {
        this.setState({ attendees: users })
        const survRef = fbc.database.public.adminRef('surveys')
        const survDraftRef = fbc.database.public.adminRef('surveysDraft')

        mapPerUserPrivateAdminablePushedDataToObjectOfStateObjects(
          fbc,
          'results',
          this,
          'results',
          (userId, key, value) => key,
          userId => userId,
        )

        survRef.on('child_added', data => {
          this.setState({ surveys: [{ ...data.val(), key: data.key }, ...this.state.surveys] })
        })

        survRef.on('child_changed', data => {
          const surveys = this.state.surveys.slice()
          for (const i in surveys) {
            if (surveys[i].key === data.key) {
              surveys[i] = Object.assign({}, data.val())
              surveys[i].key = data.key
              this.setState({ surveys })
            }
          }
        })
        survRef.on('child_removed', data => {
          this.setState({ surveys: this.state.surveys.filter(x => x.key !== data.key) })
        })
        survDraftRef.on('child_added', data => {
          this.setState({
            surveysDraft: [{ ...data.val(), key: data.key }, ...this.state.surveysDraft],
          })
        })
        survDraftRef.on('child_changed', data => {
          const surveys = this.state.surveysDraft.slice()
          for (const i in surveys) {
            if (surveys[i].key === data.key) {
              surveys[i] = Object.assign({}, data.val())
              surveys[i].key = data.key
              this.setState({ surveysDraft: surveys })
            }
          }
        })
        survDraftRef.on('child_removed', data => {
          this.setState({ surveysDraft: this.state.surveysDraft.filter(x => x.key !== data.key) })
        })
      })
    })
  }

  render() {
    return (
      <div className="App">
        <Router>
          <div>
            <Route
              exact
              path="/"
              render={({ history }) => (
                <div>
                  <div className="tableContainer">
                    <div className="headerRow">
                      <h2 className="boxTitle">{t('surveys')}</h2>
                      {this.state.isSurveysBoxDisplay && (
                        <button
                          className="dd-bordered leftMargin"
                          onClick={() => this.addNewSurvey({ history })}
                        >
                          {t('new_survey')}
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <input
                        className="searchBox"
                        value={this.state.search}
                        onChange={this.searchTable}
                        placeholder="Search"
                      />
                    </div>
                    {this.state.isSurveysBoxDisplay && (
                      <div>
                        <ul className="surveyTable">{this.renderSurveyTable({ history })}</ul>
                      </div>
                    )}
                  </div>
                  <SurveyResults
                    client={client}
                    isResultsBoxDisplay={this.state.isResultsBoxDisplay}
                    handleChange={this.handleChange}
                    results={this.state.results}
                    configKey={this.state.configKey}
                  />
                </div>
              )}
            />
            <Route
              exact
              path="/content/builder"
              render={({ history }) => {
                if (!this.state.showBuilder) return <Redirect to="/" />
                return (
                  <SurveyEditor
                    surveys={this.state.surveys}
                    configKey={this.state.configKey}
                    saveConfig={this.saveDraft}
                    config={this.state.config}
                    history={history}
                    isEditorBoxDisplay={this.state.isEditorBoxDisplay}
                    handleChange={this.handleChange}
                    showHomePage={this.showHomePage}
                    deleteSurvey={this.deleteSurvey}
                  />
                )
              }}
            />
          </div>
        </Router>
      </div>
    )
  }

  searchTable = event => {
    this.setState({ search: event.target.value, config: '', configKey: '' })
  }

  showHomePage = history => {
    this.setState({ showBuilder: false, config: '', configKey: '' })
    history.push(`/`)
  }

  addNewSurvey = ({ history }) => {
    this.setState({ showBuilder: true, config: '' })
    history.push(`/content/builder`)
  }

  renderSurveyTable = ({ history }) => {
    let surveys = this.state.surveysDraft.sort((a, b) => b.lastUpdate - a.lastUpdate)
    if (this.state.search.length) surveys = this.filterSurveys(surveys, this.state.search)
    if (surveys.length) {
      return surveys.map(a => {
        const parsedData = JSON.parse(a.info)
        const publishedVersion = this.state.surveys.find(survey => survey.key === a.key)
        const isPublished = publishedVersion
          ? publishedVersion.info === a.info && publishedVersion.isViewable
          : false
        return (
          <div
            key={a.key}
            name={a.key}
            value={a.info}
            className="buttonRow"
            onClick={event => this.loadConfig(event, a.key, a.info)}
          >
            <p className={a.key === this.state.configKey ? 'grayButtonCell' : 'buttonCell'}>
              {parsedData.title}
            </p>
            <span
              className={a.key === this.state.configKey ? 'grayRightButtonCell' : 'rightButtonCell'}
            >
              <p className={isPublished ? 'publishedText' : 'draftText'}>
                {isPublished ? 'Live' : 'Draft'}
              </p>
            </span>
            <button
              className={
                a.key === this.state.configKey ? 'grayRightButtonCellSmall' : 'rightButtonCellSmall'
              }
              name={a.key}
              value={a.info}
              onClick={event => this.loadBuilder(event, { history })}
            >
              Edit
            </button>
            <button
              className={a.key === this.state.configKey ? 'grayRightButtonCell' : 'rightButtonCell'}
              onClick={() => this.publishConfig(a, isPublished)}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        )
      })
    }
    return <p className="helpText">{t('no_surveys')}</p>
  }

  handleChange = (name, value) => {
    this.setState({ [name]: value })
  }

  filterSurveys = (surveys, search) => {
    const filteredSurveys = []
    surveys.forEach(survey => {
      const parsedData = JSON.parse(survey.info)
      const title = parsedData.title
      if (title.toLowerCase().indexOf(search.toLowerCase().trim()) !== -1) {
        filteredSurveys.push(survey)
      }
    })
    return filteredSurveys
  }

  loadConfig = (event, key, config) => {
    if (key !== this.state.configKey && event.target.className === 'buttonCell') {
      this.setState({ config, configKey: key })
    }
  }

  loadBuilder = (event, { history }) => {
    this.setState({ config: event.target.value, configKey: event.target.name, showBuilder: true })
    history.push(`/content/builder`)
  }

  deleteSurvey = history => {
    const { fbc } = this.props
    if (window.confirm(t('delete_alert'))) {
      if (this.state.configKey) {
        fbc.database.public
          .adminRef('surveys')
          .child(this.state.configKey)
          .remove()
        fbc.database.public
          .adminRef('surveysDraft')
          .child(this.state.configKey)
          .remove()
      }
      this.showHomePage(history)
    }
  }

  publishConfig = (survey, isPublished) => {
    const info = survey.info
    const state = isPublished ? t('unpublish') : t('publish')
    const name = JSON.parse(info).title
    const isDup = this.state.surveysDraft.find(
      item => JSON.parse(item.info).title === name && survey.key !== item.key,
    )
    if (isDup && !isPublished) {
      window.alert(t('dup_alert'))
    } else if (window.confirm(t('confirm_alert', { state }))) {
      const isViewable = !isPublished
      this.props.fbc.database.public
        .adminRef('surveysDraft')
        .child(survey.key)
        .update({ lastUpdate: new Date().getTime() })
      this.props.fbc.database.public
        .adminRef('surveys')
        .child(survey.key)
        .update({ info, isViewable, lastUpdate: new Date().getTime() })
    }
  }

  saveDraft = data => {
    const { fbc } = this.props
    let info = JSON.parse(data)
    info.title = info.title ? info.title : t('new_survey')
    info = JSON.stringify(info)
    if (this.state.config.length) {
      fbc.database.public
        .adminRef('surveysDraft')
        .child(this.state.configKey)
        .update({ info, lastUpdate: new Date().getTime() })
      this.setState({ config: info })
    } else {
      fbc.database.public
        .adminRef('surveysDraft')
        .push({ info, lastUpdate: new Date().getTime() })
        .then(ref => {
          this.setState({ config: info, configKey: ref.key })
        })
    }
  }
}

export default provideFirebaseConnectorToReactComponent(
  client,
  'surveys',
  (props, fbc) => <App {...props} fbc={fbc} />,
  PureComponent,
)

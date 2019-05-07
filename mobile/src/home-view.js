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
import { KeyboardAvoidingView, Platform, StyleSheet, AsyncStorage } from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { TitleBar, translate as t, useStrings } from '@doubledutch/rn-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import i18n from './i18n'
import SurveyTable from './SurveyTable'
import Loading from './Loading'
import Survey from './Survey'

useStrings(i18n)

class HomeView extends PureComponent {
  state = {
    surveys: undefined,
    showTable: true,
    config: '',
    configKey: '',
    results: [],
    surveyLoading: true,
    takeAnom: false,
    surveyResults: null,
    showSurveyResultsOption: false,
    origSurvey: null,
    origPropLaunch: true,
  }

  componentDidMount() {
    const { fbc, surveyId } = this.props
    client.getCurrentEvent().then(currentEvent => this.setState({ currentEvent }))
    client.getPrimaryColor().then(primaryColor => this.setState({ primaryColor }))
    const signin = fbc.signin()
    signin.catch(err => console.error(err))
    signin.then(() => {
      client.getCurrentUser().then(currentUser => {
        this.setState({ currentUser })
        this.loadLocalSurveys()
        const survRef = fbc.database.public.adminRef('surveys')
        const resultsRef = fbc.database.private.adminableUserRef('results')
        resultsRef.on('value', data => {
          const results = Object.entries(data.val() || {}).map(([key, val]) => key)
          this.setState({ results })
        })
        survRef.on('value', data => {
          const today = new Date().getTime()
          const surveys = Object.entries(data.val() || {})
            .map(([key, val]) => ({ ...val, key }))
            .filter(survey => {
              if (survey.publishDate) return survey.publishDate < today
              return true
            })
          this.setState({ surveys })
          this.saveLocalSurveys({ surveys })
          if (this.state.origSurvey && !surveyId) {
            const localSurvey = surveys.find(survey => survey.key === this.state.origSurvey.key)
            const disableSurveySelect = localSurvey ? !localSurvey.isViewable : true
            if (disableSurveySelect) {
              this.setState({ origSurvey: null, showTable: true })
            }
          }
        })
      })
    })
  }

  render() {
    const { suggestedTitle, surveyId } = this.props
    const {
      results,
      primaryColor,
      origSurvey,
      showSurveyResultsOption,
      surveyResults,
      origPropLaunch,
    } = this.state
    let { showTable } = this.state

    if (!this.state.currentUser || !this.state.primaryColor || !this.state.surveys)
      return <Loading />
    const surveys = this.state.surveys.sort((a, b) => b.lastUpdate - a.lastUpdate)
    let selectedSurvey = {}
    if (surveyId && origPropLaunch) {
      const directSurvey = this.state.surveys.find(survey => survey.key === surveyId)
      const previouslyCompleted = this.state.results.find(survey => survey === surveyId)
      if ((directSurvey && !previouslyCompleted) || showSurveyResultsOption) {
        selectedSurvey = this.selectSurvey(directSurvey)
        showTable = false
      }
    }

    if (origSurvey) {
      selectedSurvey = this.selectSurvey(origSurvey)
    }

    return (
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.select({ ios: 'padding', android: null })}
      >
        <TitleBar title={suggestedTitle || 'Surveys'} client={client} signin={this.signin} />
        {showTable ? (
          <SurveyTable
            results={results}
            primaryColor={primaryColor}
            surveys={surveys}
            selectSurvey={this.saveSurveyObject}
            openSurveyModal={this.openSurveyModal}
            configKey={selectedSurvey ? selectedSurvey.configKey : undefined}
          />
        ) : (
          <Survey
            selectedSurvey={selectedSurvey}
            surveyResults={surveyResults}
            saveResults={this.saveResults}
            showSurveyResultsOption={showSurveyResultsOption}
            primaryColor={primaryColor}
            closeSurveyModal={this.closeSurveyModal}
          />
        )}
      </KeyboardAvoidingView>
    )
  }

  closeSurveyModal = () => {
    this.setState({
      showTable: true,
      origSurvey: null,
      showSurveyResultsOption: false,
      origPropLaunch: false,
    })
  }

  openSurveyModal = () => {
    this.setState({ showTable: false })
  }

  saveResults = (resultsString, selectedSurvey, takeAnom) => {
    const origResults = JSON.parse(resultsString)
    const resultsKeys = Object.keys(origResults)
    const { surveyId } = this.props
    const key = surveyId && this.state.origPropLaunch ? surveyId : this.state.origSurvey.key
    let newQuestionsArray = []
    const config = JSON.parse(selectedSurvey.config)
    config.pages.forEach(page => {
      newQuestionsArray = newQuestionsArray.concat(page.elements)
    })
    const newResults = []
    if (resultsKeys.length) {
      resultsKeys.forEach(item => {
        const question = newQuestionsArray.find(question => {
          // check if key incorrectly has period at end which will be filtered out by surveyjs
          const name = question.name.replace(/\.$/, '')
          return name === item.replace('-Comment', '')
        })
        if (question) {
          const answer =
            typeof origResults[item] === 'object'
              ? JSON.stringify(origResults[item].default)
              : JSON.stringify(origResults[item])
          const title = typeof question.title === 'object' ? question.title.default : question.title
          let questionTitle = title || question.name
          questionTitle = question.label ? question.label : questionTitle
          newResults.push({
            question: questionTitle,
            answer,
            id: question.name,
          })
        }
      })
      this.setState({
        surveyResults: { newResults, schemaVersion: 3 },
        showSurveyResultsOption: true,
      })
      this.props.fbc.database.private
        .adminableUserRef('results')
        .child(key)
        .push({
          newResults,
          rawResults: origResults,
          creator: takeAnom
            ? { firstName: '', lastName: 'Anonymous', email: '', id: '' }
            : this.state.currentUser,
          timeTaken: new Date().getTime(),
          schemaVersion: 3,
        })
        .catch(x => console.error(x))
    }
  }

  saveSurveyObject = survey => {
    this.setState({ origSurvey: survey })
  }

  selectSurvey = item => {
    const parsedInfo = JSON.parse(item.info)
    parsedInfo.pages.forEach(page => {
      if (page.elements) {
        page.elements.forEach(question => {
          if (question.choices) {
            question.choices.forEach(item => {
              if (item.text) {
                item.value = item.text
              }
            })
          }
        })
      }
    })
    return {
      config: JSON.stringify(parsedInfo),
      configKey: item.key,
      allowAnom: item.allowAnom,
    }
  }

  loadLocalSurveys() {
    return AsyncStorage.getItem(this.leadStorageKey()).then(value => {
      if (value) {
        const surveys = JSON.parse(value)
        return surveys
      }
      return []
    })
  }

  saveLocalSurveys({ surveys }) {
    return AsyncStorage.setItem(this.leadStorageKey(), JSON.stringify(surveys))
  }

  leadStorageKey() {
    return `@DD:surveys_${this.state.currentEvent.id}_${this.state.currentUser.id}`
  }
}

const fontSize = 18
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  scroll: {
    flex: 1,
  },
  compose: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
  },
  sendButtons: {
    justifyContent: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    margin: 5,
  },
  sendButtonText: {
    fontSize: 20,
    color: 'gray',
  },
  composeText: {
    flex: 1,
  },
})

export default provideFirebaseConnectorToReactComponent(
  client,
  'surveys',
  (props, fbc) => <HomeView {...props} fbc={fbc} />,
  PureComponent,
)

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
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Share,
  TouchableOpacity,
  Text,
  WebView,
  AsyncStorage,
  View,
  Image
} from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { TitleBar, translate as t, useStrings } from '@doubledutch/rn-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import i18n from './i18n'
import SurveyTable from './SurveyTable'
import Loading from './Loading'
import { checkbox_active, checkbox_inactive } from './images'
import surveyViewHtml from './surveyViewHtml'

useStrings(i18n)

class HomeView extends PureComponent {
  state = {
    surveys: undefined,
    showTable: true,
    config: '',
    configKey: '',
    disable: true,
    results: [],
    surveyLoading: true,
    takeAnom: false,
    allowAnom: false,
    surveyResults: null,
    showSurveyResultsOption: false
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
        resultsRef.on('child_added', data => {
          this.setState(({ results }) => ({ results: [...results, data.key] }))
        })
        survRef.on('value', data => {
          const today = new Date().getTime()
          const surveys = Object.entries(data.val() || {}).map(([key, val]) => ({ ...val, key })).filter(survey => {
            if (survey.publishDate) return survey.publishDate < today
            else return true
          })
          if (surveyId) {
            const directSurvey = surveys.find(survey => survey.key === surveyId)
            if (directSurvey){
              this.selectSurvey(directSurvey)
              this.setState({showTable: false})
            }
          }
          this.setState({ surveys })
          this.saveLocalSurveys({ surveys })
          if (this.state.configKey) {
            const localSurvey = surveys.find(survey => survey.key === this.state.configKey)
            const disableSurveySelect = localSurvey ? !localSurvey.isViewable : true
            if (disableSurveySelect){
              this.setState({disabled: true, config: '', configKey: ''})
            }
          }
        })
      })
    })
  }

  render() {
    const { suggestedTitle } = this.props
    if (!this.state.currentUser || !this.state.primaryColor || !this.state.surveys)
      return <Loading />
    const surveys = this.state.surveys.sort((a, b) => b.lastUpdate - a.lastUpdate)
    return (
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.select({ ios: 'padding', android: null })}
      >
        <TitleBar title={suggestedTitle || 'Surveys'} client={client} signin={this.signin} />
        {this.state.showTable ? (
          <SurveyTable
            results={this.state.results}
            primaryColor={this.state.primaryColor}
            surveys={surveys}
            closeSurveyModal={this.closeSurveyModal}
            selectSurvey={this.selectSurvey}
            configKey={this.state.configKey}
            disable={this.state.disable}
          />
        ) : this.renderSurvey()}
      </KeyboardAvoidingView>
    )
  }

  renderSurvey = () => {
    const htmlSource = { html: surveyViewHtml }
    if (Platform.OS == 'android') {
      htmlSource.baseUrl = 'file:///android_asset'
    }
    return (
      <KeyboardAvoidingView style={s.container}>
        {this.state.surveyLoading && <Loading />}
        <View style={this.state.surveyLoading ? s.webHidden : s.web}>
          <WebView
            ref={input => (this.webview = input)}
            originWhitelist={['*']}
            source={htmlSource}
            injectedJavaScript={this.injectedJavaScript()}
            onMessage={e => this.saveResults(e.nativeEvent.data)}
            onLoad={this.sendInfo}
            onLoadEnd={this.surveyLoadEnd}
          />
        </View>
        {this.state.allowAnom && <View style={s.anomBox}>
          {this.renderAnomIcon()}
          <Text>{t('submitAnom')}</Text>
        </View>}
        {this.state.showSurveyResultsOption && this.state.surveyResults && (
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: this.state.primaryColor }]}
            onPress={() => this.exportResults(this.state.surveyResults)}
          >
            <Text style={s.closeText}>Exports Results</Text>
          </TouchableOpacity>
        )}
        {!this.state.surveyLoading && (
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: this.state.primaryColor }]}
            onPress={() =>
              this.setState({ showTable: true, config: '', configKey: '', disable: true, allowAnom: false })
            }
          >
            <Text style={s.closeText}>{t('exit')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    )
  }

  renderAnomIcon = () => {
    if (this.state.takeAnom) {
      return (
        <TouchableOpacity onPress={() => this.setState({takeAnom: false})}>
          <Image
            style={s.checkButton}
            source={checkbox_active}
          />
        </TouchableOpacity>
      )
    }
    return (
      <TouchableOpacity onPress={() => this.setState({takeAnom: true})}>
        <Image
          style={s.checkButton}
          source={checkbox_inactive}
        />
      </TouchableOpacity>
    )
  }

  exportResults = (results) => {
    const message = results.newResults
      .map(data => {
        let answer = ''
        const origAnswer = getAnswer(results.schemaVersion, data)
        if (typeof origAnswer === 'object' && !origAnswer.length) {
          answer = JSON.stringify(origAnswer)
        } else if (typeof origAnswer === 'object' && origAnswer.length) {
          answer = origAnswer.map(answerItem =>
            typeof answerItem === 'object' && !answerItem.length
              ? JSON.stringify(answerItem)
              : answerItem.toString(),
          )
        } else answer = origAnswer.toString()
        return `${data.question}: ${answer}\n`
      })
      .join('\n\n')
    Share.share({ message, title: t("exported_results"), subject: t("exported_results")}, {})
  }
  

  surveyLoadEnd = () => {
    this.setState({ surveyLoading: false })
  }

  sendInfo = () => {
    const config = JSON.stringify({ survey: this.state.config, color: this.state.primaryColor })
    this.webview.postMessage(config)
  }

  closeSurveyModal = () => {
    this.setState({ showTable: false, takeAnom: false, showSurveyResultsOption: false })
  }

  saveResults = resultsString => {
    const origResults = JSON.parse(resultsString)
    const resultsKeys = Object.keys(origResults)
    let newQuestionsArray = []
    const config = JSON.parse(this.state.config)
    config.pages.forEach(page => {
      newQuestionsArray = newQuestionsArray.concat(page.elements)
    })
    const newResults = []
    if (resultsKeys.length) {
      resultsKeys.forEach(item => {
        const question = newQuestionsArray.find(
          question => question.name === item.replace('-Comment', ''),
        )
        if (question) {
          const answer = JSON.stringify(origResults[item])
          let questionTitle = question.title ? question.title : question.name
          questionTitle = question.label ? question.label : questionTitle
          newResults.push({
            question: questionTitle,
            answer,
            id: question.name
          })
        }
      })
      this.props.fbc.database.private
        .adminableUserRef('results')
        .child(this.state.configKey)
        .push({
          newResults,
          creator: this.state.takeAnom ? {firstName: "", lastName:"Anonymous", email: "", id: ""} : this.state.currentUser,
          timeTaken: new Date().getTime(),
          schemaVersion: 3
        })
        .then(() => this.setState({allowAnom: false, surveyResults: {newResults, schemaVersion : 3}, showSurveyResultsOption: true}))
        .catch(x => console.error(x))
    }
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
    this.setState({ config: JSON.stringify(parsedInfo), configKey: item.key, disable: false, allowAnom: item.allowAnom })
  }



  injectedJavaScript = () => `
  `

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
  anomBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 15,
    paddingBottom: 15
  },
  web: {
    flex: 1,
  },
  webHidden: {
    height: 1,
    width: 1,
  },
  scroll: {
    flex: 1,
  },
  backButton: {
    height: 40,
    margin: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
  },
  checkButton: {
    justifyContent: 'center',
    marginLeft: 15,
    marginRight: 15,
    height: 19,
    width: 19,
  },
  task: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  checkmark: {
    textAlign: 'center',
    fontSize,
  },
  creatorAvatar: {
    marginRight: 4,
  },
  creatorEmoji: {
    marginRight: 4,
    fontSize,
  },
  taskText: {
    fontSize,
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

const getAnswer = (schemaVersion, item) =>
  schemaVersion > 1 ? JSON.parse(item.answer) : item.answer

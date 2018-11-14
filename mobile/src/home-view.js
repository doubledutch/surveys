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
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, Text, WebView, AsyncStorage } from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { TitleBar } from '@doubledutch/rn-client'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'
import SurveyTable from "./SurveyTable"
import Loading from './Loading'
import surveyViewHtml from "./surveyViewHtml"

class HomeView extends PureComponent {
  state = {
    surveys: undefined, showTable: true, config: "", configKey: "", disable: true, results: []
  }

  componentDidMount() {
    const {fbc} = this.props
    client.getCurrentEvent().then(currentEvent => this.setState({currentEvent}))
    client.getPrimaryColor().then(primaryColor => this.setState({primaryColor}))
    const signin = fbc.signin()
    signin.catch(err => console.error(err))
    signin.then(() => {
      client.getCurrentUser().then(currentUser => {
        this.setState({currentUser})
        // setTimeout(() => {
        //   this.setState({currentUser})
        // }, 500)
        this.loadLocalSurveys()
        const survRef = fbc.database.public.adminRef('surveys')
        const resultsRef = fbc.database.private.adminableUserRef('results')
        resultsRef.on("child_added", data => {
          this.setState(({results}) => ({results: [...results, data.key]}))
        })
        survRef.on('value', data => { 
          let surveys = Object.entries(data.val() || {})
          .map(([key, val]) => ({...val, key}))
          this.setState({surveys})
          this.saveLocalSurveys({surveys})
        })
      })
    })
  }

  render() {
    if (!this.state.currentUser || !this.state.primaryColor || !this.state.surveys) return <Loading />
    let htmlSource = { html: surveyViewHtml };
    if ( Platform.OS == "android" ) {
      htmlSource.baseUrl = "file:///android_asset";
    }
    const surveys = this.state.surveys.sort(function (a,b){ 
      return b.lastUpdate - a.lastUpdate
    })
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.select({ios: "padding", android: null})}>
        <TitleBar title="Surveys" client={client} signin={this.signin} />
        {this.state.showTable ? <SurveyTable results={this.state.results} primaryColor={this.state.primaryColor} surveys={surveys} closeSurveyModal={this.closeSurveyModal} selectSurvey={this.selectSurvey} configKey={this.state.configKey} disable={this.state.disable}/>
        : <KeyboardAvoidingView style={s.container}><WebView ref={input => this.webview = input} style={s.web} originWhitelist={['*']} source={htmlSource} injectedJavaScript={this.injectedJavaScript()} onMessage={e => this.saveResults(e.nativeEvent.data)} onLoad={this.sendInfo}/><TouchableOpacity style={[s.backButton, {backgroundColor: this.state.primaryColor}]} onPress={()=>this.setState({showTable: true, config: "", configKey: ""})}><Text style={s.closeText}>Exit</Text></TouchableOpacity></KeyboardAvoidingView> 
        }
      </KeyboardAvoidingView>
    )
  }


  sendInfo = () => {
    const config = JSON.stringify({survey: this.state.config, color: this.state.primaryColor})
    this.webview.postMessage(config)
  }

  closeSurveyModal = () => {
    this.setState({showTable: false})
  }

  saveResults = (resultsString) => {
    const origResults = JSON.parse(resultsString) 
    const resultsKeys = Object.keys(origResults)
    let newQuestionsArray = []
    let config = JSON.parse(this.state.config)
    config.pages.forEach(page => {
      newQuestionsArray = newQuestionsArray.concat(page.elements)
    })
    let newResults = []
    if (resultsKeys.length){
      resultsKeys.forEach(item => {
        const question = newQuestionsArray.find(question => question.name === item)
        if (question) {
          const answer = origResults[item]
          newResults.push({question : question.title ? question.title : question.name, answer: answer})
        }
      })
      this.props.fbc.database.private.adminableUserRef('results').child(this.state.configKey).push({
        newResults, creator: this.state.currentUser, timeTaken: new Date().getTime()
        })
      .then(() => this.setState({}))
      .catch (x => console.error(x))
    }    
  }

  selectSurvey = (item) => {
    let parsedInfo = JSON.parse(item.info)
    parsedInfo.pages.forEach(page => {
      if (page.elements){
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
    this.setState({config: JSON.stringify(parsedInfo), configKey: item.key, disable: false})
  }

  injectedJavaScript = () => `
  `

  loadLocalSurveys() {
    return AsyncStorage.getItem(this.leadStorageKey())
    .then(value => {
      if (value) {
        const surveys = JSON.parse(value)
        return surveys
      }
      else return []
    })
  }

  saveLocalSurveys({surveys}) {
    return AsyncStorage.setItem(this.leadStorageKey(), JSON.stringify(surveys))
  }

  leadStorageKey() { return `@DD:surveys_${this.state.currentEvent.id}_${this.state.currentUser.id}` }
}



const fontSize = 18
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  web: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  backButton: {
    height: 40,
    margin: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center"
  },
  closeText: {
    color: "white",
    fontSize: 16
  },
  task: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10
  },
  checkmark: {
    textAlign: 'center',
    fontSize
  },
  creatorAvatar: {
    marginRight: 4
  },
  creatorEmoji: {
    marginRight: 4,
    fontSize
  },
  taskText: {
    fontSize,
    flex: 1
  },
  compose: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10
  },
  sendButtons: {
    justifyContent: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    margin: 5
  },
  sendButtonText: {
    fontSize: 20,
    color: 'gray'
  },
  composeText: {
    flex: 1
  }
})

export default provideFirebaseConnectorToReactComponent(client, 'surveys', (props, fbc) => <HomeView {...props} fbc={fbc} />, PureComponent)

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
import ReactNative, {
  KeyboardAvoidingView, Platform, TouchableOpacity, Text, TextInput, View, ScrollView, WebView, Button
} from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'
import SurveyTable from "./SurveyTable"
import Loading from './Loading'
import surveyViewHtml from "./surveyViewHtml"

class HomeView extends PureComponent {
  constructor() {
    super()

    this.state = {
      surveys: [], showTable: true, config: "", configKey: "", disable: true, results: []
    }
  }

  componentDidMount() {
    const {fbc} = this.props
    const signin = fbc.signin()
    signin.catch(err => console.error(err))
    signin.then(() => {
      client.getCurrentUser().then(currentUser => {
        setTimeout(() => {
          this.setState({currentUser})
        }, 500)
      client.getPrimaryColor().then(primaryColor => this.setState({primaryColor}))
      const survRef = fbc.database.public.adminRef('surveys')
      const resultsRef = fbc.database.private.adminableUserRef('results')
      resultsRef.on("child_added", data => {
        let results = this.state.results
        results.push(data.key)
        this.setState({results})
      })

      survRef.on('child_added', data => {
        this.setState({ surveys: [{...data.val(), key: data.key }, ...this.state.surveys] })
      })

      survRef.on('child_changed', data => {
        let surveys = this.state.surveys
        let i = surveys.findIndex(item => {
          return item.key === data.key
        })
        surveys.splice(i, 1)
        this.setState({ surveys: [...this.state.surveys, {...data.val(), key: data.key }]})
      })
      survRef.on('child_removed', data => {
        this.setState({ surveys: this.state.surveys.filter(x => x.key !== data.key) })
      })
    })
    })
  }

  render() {
    if (!this.state.currentUser || !this.state.primaryColor) return <Loading />
    let htmlSource = { html: surveyViewHtml };
    if ( Platform.OS == "android" ) {
      htmlSource.baseUrl = "file:///android_asset";
    }
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.select({ios: "padding", android: null})}>
        <TitleBar title="Surveys" client={client} signin={this.signin} />
        {this.state.showTable ? <SurveyTable results={this.state.results} primaryColor={this.state.primaryColor} surveys={this.state.surveys} closeSurveyModal={this.closeSurveyModal} selectSurvey={this.selectSurvey} configKey={this.state.configKey} disable={this.state.disable}/>
        : <View style={s.container}><WebView ref={input => this.webview = input} style={s.web} originWhitelist={['*']} source={htmlSource} injectedJavaScript={this.injectedJavaScript()} onMessage={e => this.saveResults(e.nativeEvent.data)} onLoad={this.sendInfo}/><TouchableOpacity style={s.backButton} onPress={()=>this.setState({showTable: true, config: "", configKey: ""})}/></View> 
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

}

const fontSize = 18
const s = ReactNative.StyleSheet.create({
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
    height: 50,
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

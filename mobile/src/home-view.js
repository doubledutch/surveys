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

import React, { Component } from 'react'
import ReactNative, {
  KeyboardAvoidingView, Platform, TouchableOpacity, Text, TextInput, View, ScrollView, WebView, Button
} from 'react-native'

// rn-client must be imported before FirebaseConnector
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import SurveyTable from "./SurveyTable"
const fbc = FirebaseConnector(client, 'surveys')

fbc.initializeAppWithSimpleBackend()

export default class HomeView extends Component {
  constructor() {
    super()

    this.state = {
      surveys: [], showTable: true, config: "", configKey: "", disable: true
    }

    this.signin = fbc.signin()
      .then(user => this.user = user)

    this.signin.catch(err => console.error(err))
  }

  componentDidMount() {
    this.signin.then(() => {
      const survRef = fbc.database.public.adminRef('surveys')
      survRef.on('child_added', data => {
        console.log(data.val())
        this.setState({ surveys: [{...data.val(), key: data.key }, ...this.state.surveys] })
      })

      survRef.on('child_changed', data => {
        var surveys = this.state.surveys
        for (var i in surveys){
          if (surveys[i].key === data.key) {
            surveys[i] = data.val()
            surveys[i].key = data.key
            this.setState({surveys})
          }
        }
      })
    })
  }

  render() {

    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.select({ios: "padding", android: null})}>
        <TitleBar title="Surveys" client={client} signin={this.signin} />
        {this.state.showTable ? <SurveyTable surveys={this.state.surveys} closeSurveyModal={this.closeSurveyModal} selectSurvey={this.selectSurvey} configKey={this.state.configKey} disable={this.state.disable}/>
        : <View style={{flex: 1}}><WebView ref={input => this.webview = input} style={s.web} source={{uri: "https://react-barrating-widget-cxgvnp.stackblitz.io/"}} injectedJavaScript={injectedJavaScript} onMessage={e => this.saveResults(e.nativeEvent.data)} onLoad={this.sendInfo}/><Button onPress={()=>this.setState({showTable: true, config: "", configKey: ""})} title=""/></View> 
        }
      </KeyboardAvoidingView>
    )
  }

  sendInfo = () => {
    this.webview.postMessage(this.state.config)
  }

  closeSurveyModal = () => {
    console.log(this.state.config)
    this.setState({showTable: false})
  }

  saveResults = (resultsString) => {
    const results = JSON.parse(resultsString)
    fbc.database.private.adminableUserRef('results').child(this.state.configKey).push({
      results, creator: client.currentUser, timeTaken: new Date().getTime()
      })
    .then(() => this.setState({}))
    .catch (x => console.error(x))    
  }

  selectSurvey = (item) => {
    this.setState({config: item.info, configKey: item.key, disable: false})
  }



}

const injectedJavaScript = `
window.config = 'init2'
window.document.addEventListener("message", function(e) {
  window.config = e.data
});
`


const fontSize = 18
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d9e1f9',
  },
  web: {
    flex: 1,
    height: 500,
    width: 420
  },
  scroll: {
    flex: 1,
    // padding: 15
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

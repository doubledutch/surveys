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
  StyleSheet,
  WebView,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Share,
  Image,
} from 'react-native'
import { translate as t } from '@doubledutch/rn-client'
import Loading from './Loading'
import { checkbox_active, checkbox_inactive } from './images'
import surveyViewHtml from './surveyViewHtml'

export default class Survey extends PureComponent {
  state = {
    surveyLoading: true,
    containsMatrix: false,
    takeAnom: false,
  }

  render() {
    const { surveyLoading, containsMatrix, takeAnom } = this.state
    const htmlSource = { html: surveyViewHtml }
    if (Platform.OS == 'android') {
      htmlSource.baseUrl = 'file:///android_asset'
    }
    const {
      primaryColor,
      surveyResults,
      showSurveyResultsOption,
      selectedSurvey,
      closeSurveyModal,
    } = this.props
    return (
      <KeyboardAvoidingView style={s.container}>
        {surveyLoading && <Loading />}
        {containsMatrix && !showSurveyResultsOption && !surveyResults && (
          <View style={{ backgroundColor: 'white' }}>
            <Text>
              *Note: This survey contains questions that may require horizontal scrolling to
              complete
            </Text>
          </View>
        )}
        <View style={surveyLoading ? s.webHidden : s.web}>
          <WebView
            useWebKit
            ref={input => (this.webview = input)}
            originWhitelist={['*']}
            source={htmlSource}
            injectedJavaScript={this.injectedJavaScript()}
            onMessage={e => this.props.saveResults(e.nativeEvent.data, selectedSurvey, takeAnom)}
            onLoad={e => this.sendInfo(selectedSurvey)}
            onLoadEnd={this.surveyLoadEnd}
          />
        </View>
        {selectedSurvey.allowAnom && !showSurveyResultsOption && !surveyResults && (
          <View style={s.anomBox}>
            {this.renderAnomIcon()}
            <Text>{t('submitAnom')}</Text>
          </View>
        )}
        {showSurveyResultsOption && surveyResults && (
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: primaryColor }]}
            onPress={() => this.exportResults(surveyResults)}
          >
            <Text style={s.closeText}>Exports Results</Text>
          </TouchableOpacity>
        )}
        {!surveyLoading && (
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: primaryColor }]}
            onPress={closeSurveyModal}
          >
            <Text style={s.closeText}>{t('exit')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    )
  }

  sendInfo = selectedSurvey => {
    const origConfig = JSON.parse(selectedSurvey.config)
    if (origConfig.pages) {
      const containsMatrix = !!origConfig.pages.find(page => {
        if (page.elements)
          return page.elements.find(item => item.type === 'matrixdynamic' || item.type === 'matrix')
      })
      const config = JSON.stringify({
        survey: selectedSurvey.config,
        color: this.props.primaryColor,
      })
      this.setState({ containsMatrix })
      this.webview.postMessage(config)
    }
  }

  renderAnomIcon = () => {
    if (this.state.takeAnom) {
      return (
        <TouchableOpacity onPress={() => this.setState({ takeAnom: false })}>
          <Image style={s.checkButton} source={checkbox_active} />
        </TouchableOpacity>
      )
    }
    return (
      <TouchableOpacity onPress={() => this.setState({ takeAnom: true })}>
        <Image style={s.checkButton} source={checkbox_inactive} />
      </TouchableOpacity>
    )
  }

  exportResults = results => {
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
    Share.share({ message, title: t('exported_results'), subject: t('exported_results') }, {})
  }

  injectedJavaScript = () => `
  `

  surveyLoadEnd = () => {
    this.setState({ surveyLoading: false })
  }
}

const getAnswer = (schemaVersion, item) =>
  schemaVersion > 1 ? JSON.parse(item.answer) : item.answer

const s = StyleSheet.create({
  web: {
    flex: 1,
  },
  webHidden: {
    height: 1,
    width: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  checkButton: {
    justifyContent: 'center',
    marginLeft: 15,
    marginRight: 15,
    height: 19,
    width: 19,
  },
  anomBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 15,
    paddingBottom: 15,
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
})

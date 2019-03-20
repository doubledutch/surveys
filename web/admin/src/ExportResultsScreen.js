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
import { mapPerUserPrivateAdminablePushedDataToObjectOfStateObjects } from '@doubledutch/firebase-connector'

export default class ExportResultsScreen extends PureComponent {
  state = { results: {} }

  componentDidMount() {
    mapPerUserPrivateAdminablePushedDataToObjectOfStateObjects(
      this.props.fbc,
      'results',
      this,
      'results',
      (userId, key, value) => key,
      userId => userId,
    )
  }

  render() {
    const surveyResults = this.returnResults()
    return <div>{surveyResults.map(item => this.expandedCell(item))}</div>
  }

  expandedCell = item => {
    const results = item.newResults
    return (
      <div className="pdfBox">
        <div key={item.timeTaken} className="buttonRow">
          <div className="grayButtonCell">
            <p className="buttonText">
              {`${item.creator.firstName} ${item.creator.lastName} - ${new Date(
                item.timeTaken,
              ).toDateString()}`}
            </p>
          </div>
        </div>
        {results.map(data => {
          let answer = ''
          const origAnswer = getAnswer(item.schemaVersion, data)
          if (typeof origAnswer === 'object' && !origAnswer.length) {
            answer = JSON.stringify(origAnswer)
          } else if (typeof origAnswer === 'object' && origAnswer.length) {
            answer = origAnswer.map(answerItem =>
              typeof answerItem === 'object' && !answerItem.length
                ? JSON.stringify(answerItem)
                : answerItem.toString(),
            )
          } else answer = origAnswer.toString()
          return (
            <div className="subCell">
              <li className="subCellText">{`${data.question}: ${answer}`}</li>
            </div>
          )
        })}
      </div>
    )
  }

  returnResults = () => {
    let results = this.state.results[this.props.configKey]
      ? Object.values(this.state.results[this.props.configKey])
      : []
    results = results.filter(item => typeof item === 'object')
    const newResults = []
    results.forEach(item => {
      const items = Object.values(item)
      items.forEach(response => {
        if (typeof response === 'object') newResults.push(response)
      })
    })
    return newResults
  }
}

const getAnswer = (schemaVersion, item) =>
  schemaVersion > 1 ? JSON.parse(item.answer) : item.answer

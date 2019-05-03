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
import { translate as t } from '@doubledutch/admin-client'

class TableCell extends Component {
  render() {
    const { item, expandedItem } = this.props
    return expandedItem === item ? this.expandedCell(item) : this.standardCell(item)
  }

  standardCell = item => (
    <div key={item.timeTaken} className="buttonRow">
      <div className="buttonCell">
        <p className="buttonText">
          {`${item.creator.firstName} ${item.creator.lastName} - ${new Date(
            item.timeTaken,
          ).toDateString()}`}
        </p>
      </div>
      {!this.props.isPDF && item.newResults && (
        <button className="rightButtonCell" onClick={() => this.props.loadExpandedCell(item)}>
          {t('show_results')}
        </button>
      )}
    </div>
  )

  expandedCell = item => {
    const results = item.newResults
    return (
      <div>
        <div key={item.timeTaken} className="buttonRow">
          <div className="grayButtonCell">
            <p className="buttonText">
              {`${item.creator.firstName} ${item.creator.lastName} - ${new Date(
                item.timeTaken,
              ).toDateString()}`}
            </p>
          </div>
          {!this.props.isPDF && (
            <button
              className="grayRightButtonCell"
              onClick={() => this.props.loadExpandedCell(item)}
            >
              {t('hide_results')}
            </button>
          )}
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
            <div className="subCell" key={data.question}>
              <li className="subCellText">{`${data.question}: ${answer}`}</li>
            </div>
          )
        })}
      </div>
    )
  }
}

const getAnswer = (schemaVersion, item) =>
  schemaVersion > 1 ? JSON.parse(item.answer) : item.answer

export default TableCell

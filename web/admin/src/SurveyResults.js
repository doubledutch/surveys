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
import { CSVLink, CSVDownload } from '@doubledutch/react-csv'

class SurveyResults extends Component {
  constructor() {
    super()
    this.state = {
      selectedCell: '',
      expandedItem: '',
      exporting: false,
      exportList: [],
    }
  }

  render() {
    return (
      <div className="tableContainer">
        <div className="headerRow">
          <h2 className="boxTitle">{t('results')}</h2>
          <div style={{ flex: 1 }} />
          <button
            className="displayButton"
            onClick={() =>
              this.props.handleChange('isResultsBoxDisplay', !this.props.isResultsBoxDisplay)
            }
          >
            {this.props.isResultsBoxDisplay ? t('hide') : t('show')}
          </button>
        </div>
        {this.props.isResultsBoxDisplay && this.renderTable()}
      </div>
    )
  }

  renderTable = () => {
    let results = this.props.results[this.props.configKey]
      ? Object.values(this.props.results[this.props.configKey])
      : []
    results = results.filter(item => typeof item === 'object')
    const newResults = []
    results.forEach(item => {
      const items = Object.values(item)
      items.forEach(response => {
        if (typeof response === 'object') newResults.push(response)
      })
    })
    return (
      <div>
        <ul className="surveyTable">
          {this.props.configKey.length === 0 && this.props.surveys.length > 0 && (
            <p className="helpText">{t('select')}</p>
          )}
          {this.props.surveys.length === 0 && (
            <p className="helpText">{t('no_survey_select_message')}</p>
          )}
          {this.props.configKey.length > 0 && results.length === 0 && (
            <p className="helpText">{t('no_responses')}</p>
          )}
          {newResults.map(item =>
            this.state.expandedItem === item ? this.expandedCell(item) : this.standardCell(item),
          )}
        </ul>
        <div className="csvLinkBox">
          <button className="button" onClick={() => this.prepareCsv(newResults)}>
            {t('export')}
          </button>
          {this.state.exporting ? (
            <CSVDownload data={this.state.exportList} filename="results.csv" target="_blank" />
          ) : null}
        </div>
      </div>
    )
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
      <button className="rightButtonCell" onClick={() => this.loadExpandedCell(item)}>
        {t('show_results')}
      </button>
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
          <button className="grayRightButtonCell" onClick={() => this.loadExpandedCell(item)}>
            {t('hide_results')}
          </button>
        </div>
        {results.map(item => {
          let answer = ''
          if (typeof item.answer === 'object' && !item.answer.length) {
            answer = JSON.stringify(item.answer)
          } else if (typeof item.answer === 'object' && item.answer.length) {
            answer = item.answer.map(answer =>
              typeof answer === 'object' && !answer.length
                ? JSON.stringify(answer)
                : answer.toString(),
            )
          } else answer = item.answer.toString()
          return (
            <div className="subCell">
              <li className="subCellText">{`${item.question}: ${answer}`}</li>
            </div>
          )
        })}
      </div>
    )
  }

  parseResultsForExport = results => {
    const parsedResults = []
    results.forEach(item => {
      const newItem = {
        firstName: item.creator.firstName,
        lastName: item.creator.lastName,
        email: item.email,
        timeTaken: new Date(item.timeTaken).toDateString(),
      }
      item.newResults.forEach(item => {
        const title = item.question
        let answer = ''
        if (typeof item.answer === 'object' && !item.answer.length) {
          answer = stringifyForCsv(item.answer)
        } else if (typeof item.answer === 'object' && item.answer.length) {
          answer = item.answer.map(answer =>
            typeof answer === 'object' && !answer.length
              ? stringifyForCsv(answer)
              : answer.toString(),
          )
        } else answer = item.answer.toString()
        newItem[title] = answer
        newItem.surveyTitle = JSON.parse(this.props.config).title
      })
      parsedResults.push(newItem)
    })
    return parsedResults
  }

  prepareCsv = results => {
    if (this.state.exporting) {
      return
    }
    let newList = []
    const attendeeClickPromises = results.map(result =>
      this.props.client
        .getAttendee(result.creator.id)
        .then(attendee => ({ ...result, ...attendee }))
        .catch(err => result),
    )

    Promise.all(attendeeClickPromises).then(newResults => {
      // Build CSV and trigger download...
      newList = this.parseResultsForExport(newResults)
      this.setState({ exporting: true, exportList: newList })
      setTimeout(() => this.setState({ exporting: false, newList: [] }), 3000)
    })
  }

  loadExpandedCell = currentItem => {
    const item = this.state.expandedItem === currentItem ? '' : currentItem
    this.setState({ expandedItem: item })
  }
}

function stringifyForCsv(obj) {
  return Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
}

export default SurveyResults

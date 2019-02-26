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
      exportHeaders: null,
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
          {newResults.length > 0 && (
            <button className="button" onClick={() => this.prepareCsv(newResults)}>
              {t('export')}
            </button>
          )}
          {this.state.exporting ? (
            <CSVDownload
              data={this.state.exportList}
              headers={this.state.exportHeaders}
              filename="results.csv"
              target="_blank"
            />
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

  parseResultsForExport = results => {
    const parsedResults = []
    // This new variable is to take into account question keys so that we can properly parse duplicate questions in a survey
    const idExists = results.every(item => item.schemaVersion > 2)
    results.forEach(item => {
      const newItem = {
        surveyTitle: JSON.parse(this.props.config).title,
        firstName: item.creator.firstName,
        lastName: item.creator.lastName,
        email: item.email,
        timeTaken: new Date(item.timeTaken).toDateString(),
      }
      item.newResults.forEach((data, i) => {
        const title = data.question
        let answer = ''
        const origAnswer = getAnswer(item.schemaVersion, data)
        if (typeof origAnswer === 'object' && !origAnswer.length) {
          answer = stringifyForCsv(origAnswer)
        } else if (typeof origAnswer === 'object' && origAnswer.length) {
          answer = origAnswer
            .map(newAnswer =>
              typeof newAnswer === 'object' && !newAnswer.length
                ? stringifyForCsv(newAnswer)
                : newAnswer.toString(),
            )
            .join('; ')
        } else {
          answer = origAnswer.toString()
        }
        let adjustedTitleForExport = title.replace(/\./g, ' ')
        adjustedTitleForExport = newItem[adjustedTitleForExport]
          ? `${adjustedTitleForExport}-Question:${i}`
          : adjustedTitleForExport
        if (idExists) {
          adjustedTitleForExport = data.id
        }
        newItem[adjustedTitleForExport] = answer
      })
      parsedResults.push(newItem)
    })
    return parsedResults
  }

  prepareHeaders = results => {
    // This function is to take into account question keys so that we can properly parse duplicate questions in a survey for export
    const headers = [
      { label: 'Survey Title', key: 'surveyTitle' },
      { label: 'First Name', key: 'firstName' },
      { label: 'Last Name', key: 'lastName' },
      { label: 'Email', key: 'email' },
      { label: 'Time', key: 'timeTaken' },
    ]
    const idExists = results.every(item => item.schemaVersion > 2)
    if (idExists) {
      let origQuestions = []
      JSON.parse(this.props.config).pages.forEach(
        page => (origQuestions = origQuestions.concat(page.elements)),
      )
      origQuestions.forEach(question => {
        headers.push({ label: question.title ? question.title : question.name, key: question.name })
      })
      return headers
    }
    return null
  }

  prepareCsv = results => {
    if (this.state.exporting) {
      return
    }

    const attendeeClickPromises = results.map(result =>
      this.props.client
        .getAttendee(result.creator.id)
        .then(attendee => ({ ...result, ...attendee }))
        .catch(err => result),
    )

    Promise.all(attendeeClickPromises).then(newResults => {
      // Build CSV and trigger download...
      const newList = this.parseResultsForExport(newResults)
      const headers = this.prepareHeaders(newResults)
      this.setState({ exporting: true, exportList: newList, exportHeaders: headers })
      setTimeout(
        () => this.setState({ exporting: false, exportList: [], exportHeaders: null }),
        3000,
      )
    })
  }

  loadExpandedCell = currentItem => {
    const item = this.state.expandedItem === currentItem ? '' : currentItem
    this.setState({ expandedItem: item })
  }
}

const getAnswer = (schemaVersion, item) =>
  schemaVersion > 1 ? JSON.parse(item.answer) : item.answer

function stringifyForCsv(obj) {
  return Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
}

export default SurveyResults

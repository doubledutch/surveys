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
import { CSVDownload } from '@doubledutch/react-csv'
import TableCell from './TableCell'

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
          {newResults.map(item => (
            <TableCell
              expandedItem={this.state.expandedItem}
              item={item}
              loadExpandedCell={this.loadExpandedCell}
              key={item.timeTaken}
            />
          ))}
        </ul>
        {newResults.length > 0 && (
          <div className="csvLinkBox">
            <a
              className="dd-bordered"
              href={this.bigScreenUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              View All Results
            </a>
            <button className="button" onClick={() => this.prepareCsv(newResults)}>
              {t('export')}
            </button>

            {this.state.exporting ? (
              <CSVDownload
                data={this.state.exportList}
                headers={this.state.exportHeaders}
                filename="results.csv"
                target="_blank"
              />
            ) : null}
          </div>
        )}
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
          adjustedTitleForExport = data.id.replace(/\.$/, '')
        }
        newItem[adjustedTitleForExport.trim()] = answer.replace(/"/g, '""')
      })
      parsedResults.push(newItem)
    })
    return parsedResults
  }

  bigScreenUrl = () =>
    this.props.longLivedToken
      ? `?page=exportResults&configKey=${encodeURIComponent(
          this.props.configKey,
        )}&token=${encodeURIComponent(this.props.longLivedToken)}`
      : null

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
      JSON.parse(this.props.config).pages.forEach(page => {
        if (page.elements) origQuestions = origQuestions.concat(page.elements)
      })
      origQuestions.forEach(question => {
        const name = question.name.replace(/\.$/, '')
        const title = typeof question.title === 'object' ? question.title.default : question.title
        headers.push({
          label: title || question.name.trim(),
          key: name.trim(),
        })
      })
      return headers
    }
    return null
  }

  prepareCsv = results => {
    const attendeeClickPromises = results.map(result => {
      if (result.creator.id) {
        return this.props.client
          .getAttendee(result.creator.id)
          .then(attendee => ({ ...result, ...attendee }))
          .catch(err => result)
      }
      return result
    })

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

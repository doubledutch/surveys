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
import TableCell from './TableCell'

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
    return (
      <div>
        {surveyResults.map(item => (
          <div className="pdfBox">
            <TableCell item={item} expandedItem={item} isPDF />
          </div>
        ))}
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

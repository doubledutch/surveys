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
import {CSVLink} from 'react-csv'


class SurveyResults extends Component {
  constructor() {
    super()
    this.state = {
      selectedCell: "",
      expandedItem: ""
    }
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  render() {
    return (
      <div className="tableContainer">
      <div className="headerRow">
        <h2>Results</h2>
        <div style={{flex: 1}}/>
        <button className="displayButton" onClick={() => this.props.handleChange("isResultsBoxDisplay", !this.props.isResultsBoxDisplay)}>{(this.props.isResultsBoxDisplay ? "Hide Section" : "Show Section")}</button>
      </div>
      {this.props.isResultsBoxDisplay && this.renderTable()}
    </div>
    )
  }

  renderTable = () => {
    let results = this.props.results[this.props.configKey] ? Object.values(this.props.results[this.props.configKey]) : []
    results = results.filter(item => typeof item === "object")
    return (
      <div>
        <ul className="surveyTable">
            {this.props.configKey.length === 0 && <p className="helpText">Select a survey to see responses</p>}
            {this.props.configKey.length > 0 && results.length === 0 && <p className="helpText">No responses found</p>}
            { results.map(item => {
              return this.state.expandedItem === item ? this.expandedCell(item) : this.standardCell(item)
            })
            }
        </ul>
        <div className="csvLinkBox">
          <CSVLink className="csvButton" data={this.parseResultsForExport(results)} filename={"results.csv"}>Export Responses</CSVLink>
        </div>
      </div>
    )
  }

  standardCell = (item) => {
    return (
      <div key={item.timeTaken} className="buttonRow"> 
        <div className="buttonCell"><p className="buttonText">{item.creator.firstName + " " + item.creator.lastName + " - " + new Date(item.timeTaken).toDateString()}</p></div>
        <button className="rightButtonCell" onClick={() => this.loadExpandedCell(item)}>Show Results</button>      
      </div>
    )
  }

  expandedCell = (item) => {
    const results = Object.keys(item.results)
    return (
      <div>
        <div key={item.timeTaken} className="buttonRow"> 
          <div className="grayButtonCell"><p className="buttonText">{item.creator.firstName + " " + item.creator.lastName + " - " + new Date(item.timeTaken).toDateString()}</p></div>
          <button className="grayRightButtonCell" onClick={() => this.loadExpandedCell(item)}>Hide Results</button>      
        </div>
        {results.map(question => {
          return (
            <div className="subCell">
              <p className="subCellText">{question + ": " +item.results[question]}</p>
            </div>
          )
        })}
      </div>
    )
  }

  parseResultsForExport = (results) => {
    let parsedResults = []
    results.forEach(item => {
      let newItem = {...item.results, firstName: item.creator.firstName, lastName: item.creator.lastName, email: item.creator.email, timeTaken: item.timeTaken}
      parsedResults.push(newItem)
    })
    return parsedResults
  }

  loadExpandedCell = (currentItem) => {
    const item = this.state.expandedItem === currentItem ? "" : currentItem
    this.setState({expandedItem: item})
  }

}

export default SurveyResults;
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
import './App.css'
import moment from 'moment'
import client from '@doubledutch/admin-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import { mapPerUserPrivateAdminablePushedDataToStateObjects } from "@doubledutch/firebase-connector"
import { HashRouter as Router, Redirect, Route } from 'react-router-dom'
import 'react-tabs/style/react-tabs.css';

import SurveyWrapper from './SurveyWrapper';
import SurveyEditor from "./SurveyEditor";
import SurveyResults from "./SurveyResults";
import * as Survey from "survey-react";
import '@doubledutch/react-components/lib/base.css'
import "survey-react/survey.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.css";

import "jquery-ui/themes/base/all.css";
import "nouislider/distribute/nouislider.css";
import "select2/dist/css/select2.css";
import "bootstrap-slider/dist/css/bootstrap-slider.css";

import "jquery-bar-rating/dist/themes/css-stars.css";

import $ from "jquery";
import "jquery-ui/ui/widgets/datepicker.js";
import "select2/dist/js/select2.js";
import "jquery-bar-rating";

import * as widgets from "surveyjs-widgets";

const fbc = FirebaseConnector(client, 'surveys')
fbc.initializeAppWithSimpleBackend()

widgets.icheck(Survey, $);
widgets.select2(Survey, $);
widgets.inputmask(Survey);
widgets.jquerybarrating(Survey, $);
widgets.jqueryuidatepicker(Survey, $);
widgets.nouislider(Survey);
widgets.select2tagbox(Survey, $);
widgets.signaturepad(Survey);
widgets.sortablejs(Survey);
widgets.ckeditor(Survey);
widgets.autocomplete(Survey, $);
widgets.bootstrapslider(Survey);


export default class App extends Component {
  
  constructor() {
    super()
    this.state = {
      surveys: [],
      results: [],
      config: "",
      configKey: "",
      isSurveysBoxDisplay: true,
      isEditorBoxDisplay: true,
      isResultsBoxDisplay: true,
      showBuilder: false
    }
    this.signin = fbc.signinAdmin()
    .then(user => this.user = user)
    .catch(err => console.error(err))
  }

  componentDidMount() {
    import("icheck");
    window["$"] = window["jQuery"] = $;
    this.signin.then(() => {
    client.getUsers().then(users => {
      this.setState({attendees: users})
      const survRef = fbc.database.public.adminRef('surveys')

      mapPerUserPrivateAdminablePushedDataToStateObjects(fbc, 'results', this, 'results', (userId, key, value) => key)



      survRef.on('child_added', data => {
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
  })

  }

  render() {
    // Survey.Survey.cssType = "bootstrap";
    // var model = new Survey.Model(this.state.config);
    return (
      <div className="App">
        <Router>
          <div>
              <Route exact path="/" render={({history}) => (
                <div>
                  <div className="tableContainer">
                    <div className="headerRow">
                      <h2>Surveys</h2>
                      {this.state.isSurveysBoxDisplay && <button className="dd-bordered leftMargin" onClick={()=>this.addNewSurvey({history})}> New Survey</button>}
                      <div style={{flex: 1}}/>
                      <button className="displayButton" onClick={() => this.handleChange("isSurveysBoxDisplay", !this.state.isSurveysBoxDisplay)}>{(this.state.isSurveysBoxDisplay ? "Hide Section" : "Show Section")}</button>
                    </div>
                    {this.state.isSurveysBoxDisplay && <div>
                      <ul className="surveyTable">
                        {this.renderSurveyTable({history})}
                      </ul>
                    </div>}
                  </div>
                  <SurveyResults isResultsBoxDisplay={this.state.isResultsBoxDisplay} handleChange={this.handleChange} results={this.state.results} configKey = {this.state.configKey}/>
                </div> )} />
              <Route exact path="/content/builder" render={({match}) => {
                if (!this.state.showBuilder) return <Redirect to="/" />
                return <SurveyEditor saveConfig={this.saveConfig} config={this.state.config} isEditorBoxDisplay={this.state.isEditorBoxDisplay} handleChange={this.handleChange}/>
              }} />
              {/* <div className="surveyjs">
                <Survey.Survey model={model} onComplete={this.onComplete} onValueChanged={this.onValueChanged}/>        
              </div> */}
          </div>
        </Router>
      </div>
      );
  }

  addNewSurvey = ({history}) => {
    this.setState({showBuilder: true, config: ""})
    history.push(`/content/builder`)
  }


  renderSurveyTable=({history})=> {
    if (this.state.surveys.length) {
      return this.state.surveys.map(a => {
        const parsedData = JSON.parse(a.info)
        return <div key={a.key} className="buttonRow"> 
          <button className={a.key === this.state.configKey ? "grayButtonCell":"buttonCell"} name={a.key} value={a.info} onClick={this.loadConfig}><p className="buttonText">{parsedData.title}</p></button>
          <button className={a.key === this.state.configKey ? "grayRightButtonCellSmall":"rightButtonCellSmall"} name={a.key} value={a.info} onClick={(event) => this.loadBuilder(event, {history})}>Edit</button>  
          <button className={a.key === this.state.configKey ? "grayRightButtonCell":"rightButtonCell"} onClick={()=>this.updateStatus(a.key, a.isViewable)}>{a.isViewable ? "Hide in App" : "Display in App"}</button>      
        </div>
      })
    }
  }


  handleChange = (name, value) => {
    this.setState({[name]: value});
  }

  onValueChanged(result) {
    console.log("value changed!");
  }

  onComplete(result) {
    console.log("Survey Completed! " + result);
    console.log(result.valuesHash);
  }

  loadConfig = (event) => {
    this.setState({config: event.target.value, configKey: event.target.name})
  }

  loadBuilder = (event, {history}) => {
    this.setState({config: event.target.value, configKey: event.target.name, showBuilder: true})
    history.push(`/content/builder`)
  }

  updateStatus = (key, isViewable) => {
    const current = isViewable
    fbc.database.public.adminRef('surveys').child(key).update({isViewable: true, isViewable: !current})
  }

  saveConfig=(data)=> {
    let info = JSON.parse(data)
    info.title = info.title ? info.title : "New Survey"
    info = JSON.stringify(info)
    if (this.state.config.length) {
      fbc.database.public.adminRef('surveys').child(this.state.configKey).update({info})
      this.setState({config: info, showBuilder: false})
    }
    else {
      fbc.database.public.adminRef('surveys').push({info, isViewable: true})
      this.setState({config: info, showBuilder: false})
    }
  }



}

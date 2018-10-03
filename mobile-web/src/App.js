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

import React, { Component } from 'react';
import { render } from 'react-dom';
import './App.css';
import "survey-react/survey.css";
import "bootstrap/dist/css/bootstrap.css";
import SurveyWrapper from "./SurveyWrapper"
import * as SurveyKo from "survey-knockout";
import * as Survey from "survey-react";
import * as Widgets from 'surveyjs-widgets';

import $ from 'jquery';
import jquery from 'jquery';
window.$ = window.jQuery = jquery;

class App extends Component {
  constructor(props) { 
    super(props)
    
    this.state = {
      survey: "",
      color: ""
    }
    Widgets.jquerybarrating(SurveyKo);    
    Widgets.jquerybarrating(Survey);
  }
  componentDidMount(){
    document.addEventListener("message", e => {
      const config = JSON.parse(e.data)
      const survey = config ? config.survey : ""
      const color = config ? config.color : ""
      this.setState({survey, color})
    })
  }

  render() {
    return (
      this.state.color && this.state.survey ? <SurveyWrapper survey={this.state.survey} color={this.state.color}/> : null
    );
  }
}

export default App

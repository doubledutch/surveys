import React, { Component } from "react";
import * as SurveyJSEditor from "surveyjs-editor";
import * as SurveyKo from "survey-knockout";
import "surveyjs-editor/surveyeditor.css";
import "jquery-ui/themes/base/all.css";
import "select2/dist/css/select2.css";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "jquery-bar-rating/dist/themes/css-stars.css";
import "jquery-bar-rating/dist/themes/fontawesome-stars.css";
import $ from "jquery";
import "jquery-ui/ui/widgets/datepicker.js";
import "select2/dist/js/select2.js";
import "jquery-bar-rating";

import "icheck/skins/square/blue.css";


import * as widgets from "surveyjs-widgets";

widgets.icheck(SurveyKo, $);
widgets.jquerybarrating(SurveyKo, $);
widgets.jqueryuidatepicker(SurveyKo, $);
widgets.bootstrapslider(SurveyKo)


class SurveyEditor extends Component {
  editor;
  constructor() {
    super()
    var mainColor = "#73aaf3";
    var mainHoverColor = "#73aaf3";
    var textColor = "#4a4a4a";
    var headerColor = "#73aaf3";
    var headerBackgroundColor = "#4a4a4a";
    var bodyContainerBackgroundColor = "#f8f8f8";

    var defaultThemeColorsEditor = SurveyJSEditor
        .StylesManager
        .ThemeColors["default"];
    defaultThemeColorsEditor["$primary-color"] = mainColor;
    defaultThemeColorsEditor["$secondary-color"] = mainColor;
    defaultThemeColorsEditor["$primary-hover-color"] = mainHoverColor;
    defaultThemeColorsEditor["$primary-text-color"] = textColor;
    defaultThemeColorsEditor["$secondary-border-color"] = mainColor;
    defaultThemeColorsEditor["$selection-border-color"] = mainColor;
    SurveyJSEditor.StylesManager.applyTheme();        
  }
  
  componentDidMount() {
    let editorOptions = { 
      showEmbededSurveyTab: false, showPropertyGrid: false, showPagesToolbox: true, useTabsInElementEditor: true, showJSONEditorTab: true,
      questionTypes: ["text", "checkbox", "radiogroup", "dropdown", "boolean", "matrix", "matrixdynamic", "rating", "imagepicker", "comment", "expression", "panel", "multipletext"]
    };
    this.editor = new SurveyJSEditor.SurveyEditor(
      "editorElement",
      editorOptions
    );
    this.editor.isAutoSave = true
    this.editor.saveSurveyFunc = this.saveMySurvey;
    this.editor.text = this.props.config || ""
  }

  render() {
    const publishedVersion = this.props.surveys.find(survey => survey.key === this.props.configKey)
    const publishedTime = publishedVersion ? new Date(publishedVersion.lastUpdate) : undefined
    return (
    <div className="tableContainer">
      <div className="headerRow">
        <h2 className="boxTitle">Editor</h2>
        {publishedTime ? <p className="publishedTime">Last Published: {publishedTime.toLocaleString()}</p> : null}
        <div className="flex"></div>
        <button className="dd-bordered" onClick={()=>this.props.showHomePage(this.props.history)}>Cancel</button>
        <button className="deleteButton" onClick={()=> this.props.deleteSurvey(this.props.history)}>Delete</button>
      </div>
      {this.props.isEditorBoxDisplay && <div id="editorElement" />}
    </div>
    )
  }
  saveMySurvey = () => {
    this.props.saveConfig(this.editor.text)
  };
}

export default SurveyEditor;

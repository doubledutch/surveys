import React, { Component } from "react";
import * as SurveyJSEditor from "surveyjs-editor";
import * as SurveyKo from "survey-knockout";

import "surveyjs-editor/surveyeditor.css";

import "jquery-ui/themes/base/all.css";
import "nouislider/distribute/nouislider.css";
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
widgets.select2(SurveyKo, $);
widgets.inputmask(SurveyKo);
widgets.jquerybarrating(SurveyKo, $);
widgets.jqueryuidatepicker(SurveyKo, $);
widgets.nouislider(SurveyKo);
widgets.select2tagbox(SurveyKo, $);
widgets.signaturepad(SurveyKo);
widgets.sortablejs(SurveyKo);
widgets.ckeditor(SurveyKo);
widgets.autocomplete(SurveyKo, $);
widgets.bootstrapslider(SurveyKo)


class SurveyEditor extends Component {
  editor;
  // SurveyEditor.StylesManager.applyTheme("winterstone"); 
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
    defaultThemeColorsEditor["$selection-border-color"] = mainColor;
    SurveyJSEditor.StylesManager.applyTheme();        
  }
  
  componentDidMount() {
    let editorOptions = { showEmbededSurveyTab: false, showPropertyGrid: false, showPagesToolbox: false, useTabsInElementEditor: true, showJSONEditorTab: false};

    this.editor = new SurveyJSEditor.SurveyEditor(
      "editorElement",
      editorOptions
    );

    // this.editor.StylesManager.applyTheme("winterstone"); 
    this.editor.saveSurveyFunc = this.saveMySurvey;

    this.editor.text = this.props.config || ""

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.config !== this.editor.text) {
      this.editor.text = nextProps.config
    }
  }

  render() {
    return (
      <div className="tableContainer">
      <div className="headerRow">
        <h2>Editor</h2>
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

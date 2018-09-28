import React from 'react';
import * as Survey from "survey-react";
import * as Widgets from "surveyjs-widgets";

class SurveyWrapper extends React.Component {

  constructor() {
    super()
    var mainColor = "#7ff07f";
    var mainHoverColor = "#6fe06f";
    var textColor = "#4a4a4a";
    var headerColor = "#7ff07f";
    var headerBackgroundColor = "#4a4a4a";
    var bodyContainerBackgroundColor = "#f8f8f8";
    var defaultThemeColorsSurvey = Survey
    .StylesManager
    .ThemeColors["default"];
    defaultThemeColorsSurvey["$main-color"] = mainColor;
    defaultThemeColorsSurvey["$main-hover-color"] = mainHoverColor;
    defaultThemeColorsSurvey["$text-color"] = textColor;
    defaultThemeColorsSurvey["$header-color"] = headerColor;
    defaultThemeColorsSurvey["$header-background-color"] = headerBackgroundColor;
    defaultThemeColorsSurvey["$body-container-background-color"] = bodyContainerBackgroundColor;
    Survey.StylesManager.applyTheme();        
  }

  onValueChanged(result) {
    console.log("value changed!");
  }

  onComplete(result) {
    console.log("Survey Completed! " + result);
    console.log(result.valuesHash);
    window.postMessage(JSON.stringify(result.valuesHash))
  }

  render() {        
    var model = new Survey.Model(this.props.config);
    return (
      <div>
        <div className="surveyjs">
          <Survey.Survey model={model} onComplete={this.onComplete} onValueChanged={this.onValueChanged}/>        
        </div>        
      </div>)
  }
}
export default SurveyWrapper;
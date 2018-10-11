import React from 'react';
import * as Survey from "survey-react";
import * as widgets from "surveyjs-widgets";
import $ from "jquery";
import "jquery-ui/ui/widgets/datepicker.js";

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

class SurveyWrapper extends React.Component {

  componentDidMount() {
    const propColor = this.props.color ? this.props.color : "blue"
    var mainColor = propColor;
    var mainHoverColor = propColor;
    var textColor = '#364247';
    var headerColor = "#364247";
    var headerBackgroundColor = "#FFFFFF";
    var bodyContainerBackgroundColor = "#EFEFEF";
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

  onComplete(result) {
    console.log("Survey Completed! " + result);
    window.postMessage(JSON.stringify(result.valuesHash))
  }

  render() {  
    const model = new Survey.Model(this.props.survey ? this.props.survey : "");
    return (
      <div>
        <div className="surveyjs">
          <Survey.Survey model={model} onComplete={this.onComplete}/>        
        </div>        
      </div>)
  }
}
export default SurveyWrapper;
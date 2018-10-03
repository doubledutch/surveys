import React from 'react';
import * as Survey from "survey-react";
import * as Widgets from "surveyjs-widgets";

class SurveyWrapper extends React.Component {

  constructor(props) {
    super(props)
  }

  componentDidMount = () => {
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

  onValueChanged(result) {
    console.log("value changed!");
  }

  onComplete(result) {
    console.log("Survey Completed! " + result);
    window.postMessage(JSON.stringify(result.valuesHash))
  }

  render() {  
    var model = new Survey.Model(this.props.survey ? this.props.survey : "");
    var surveyJSON = new Survey.Model({pages:[{name:"page1",elements:[{type:"imagepicker",name:"question1",choices:[{value:"lion",imageLink:"https://surveyjs.io/Content/Images/examples/image-picker/lion.jpg"},{value:"giraffe",imageLink:"https://surveyjs.io/Content/Images/examples/image-picker/giraffe.jpg"},{value:"panda",imageLink:"https://surveyjs.io/Content/Images/examples/image-picker/panda.jpg"},{value:"camel",imageLink:"https://surveyjs.io/Content/Images/examples/image-picker/camel.jpg"}]},{type:"text",name:"question2"},{type:"checkbox",name:"question3",choices:["item1","item2","item3"]},{type:"radiogroup",name:"question4",choices:["item1","item2","item3"]},{type:"dropdown",name:"question5",choices:["item1","item2","item3"]}] ,title:"New"}]})
    return (
      <div>
        <div className="surveyjs">
          <Survey.Survey model={model} onComplete={this.onComplete} onValueChanged={this.onValueChanged}/>        
        </div>        
      </div>)
  }
}
export default SurveyWrapper;
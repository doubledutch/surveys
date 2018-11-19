import React from 'react'
import * as Survey from 'survey-react'
import * as widgets from 'surveyjs-widgets'
import $ from 'jquery'
import 'jquery-ui/ui/widgets/datepicker.js'

widgets.icheck(Survey, $)
widgets.select2(Survey, $)
widgets.inputmask(Survey)
widgets.jquerybarrating(Survey, $)
widgets.jqueryuidatepicker(Survey, $)
widgets.nouislider(Survey)
widgets.select2tagbox(Survey, $)
widgets.signaturepad(Survey)
widgets.sortablejs(Survey)
widgets.ckeditor(Survey)
widgets.autocomplete(Survey, $)
widgets.bootstrapslider(Survey)

class SurveyWrapper extends React.Component {
  constructor() {
    super()
    Survey.StylesManager.applyTheme('blue')
  }

  onValueChanged(result) {
    console.log('value changed!')
  }

  onComplete(result) {
    console.log(`Survey Completed! ${result}`)
    console.log(result.valuesHash)
  }

  render() {
    Survey.Survey.cssType = 'bootstrap'
    const model = new Survey.Model(this.props.config)

    return (
      <div>
        <div className="surveyjs">
          <Survey.Survey
            model={model}
            onComplete={this.onComplete}
            onValueChanged={this.onValueChanged}
          />
        </div>
      </div>
    )
  }
}
export default SurveyWrapper

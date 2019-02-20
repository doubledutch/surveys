import React, { Component } from 'react'
import { translate as t } from '@doubledutch/admin-client'
import * as SurveyJSEditor from 'surveyjs-editor'
import * as SurveyKo from 'survey-knockout'
import 'surveyjs-editor/surveyeditor.css'
import 'jquery-ui/themes/base/all.css'
import 'select2/dist/css/select2.css'
import 'bootstrap-slider/dist/css/bootstrap-slider.css'
import 'jquery-bar-rating/dist/themes/css-stars.css'
import 'jquery-bar-rating/dist/themes/fontawesome-stars.css'
import $ from 'jquery'
import 'jquery-ui/ui/widgets/datepicker.js'
import 'select2/dist/js/select2.js'
import 'jquery-bar-rating'

import 'icheck/skins/square/blue.css'

import * as widgets from 'surveyjs-widgets'
import CheckIcon from './CheckIcon'

widgets.icheck(SurveyKo, $)
widgets.jquerybarrating(SurveyKo, $)
widgets.jqueryuidatepicker(SurveyKo, $)
widgets.bootstrapslider(SurveyKo)

class SurveyEditor extends Component {
  editor

  constructor(props) {
    super(props)
    this.state = {
      allowAnom: false,
    }
    const mainColor = '#73aaf3'
    const mainHoverColor = '#73aaf3'
    const textColor = '#4a4a4a'
    const headerColor = '#73aaf3'
    const headerBackgroundColor = '#4a4a4a'
    const bodyContainerBackgroundColor = '#f8f8f8'

    const defaultThemeColorsEditor = SurveyJSEditor.StylesManager.ThemeColors.default
    defaultThemeColorsEditor['$primary-color'] = mainColor
    defaultThemeColorsEditor['$secondary-color'] = mainColor
    defaultThemeColorsEditor['$primary-hover-color'] = mainHoverColor
    defaultThemeColorsEditor['$primary-text-color'] = textColor
    defaultThemeColorsEditor['$secondary-border-color'] = mainColor
    defaultThemeColorsEditor['$selection-border-color'] = mainColor
    SurveyJSEditor.StylesManager.applyTheme()
  }

  componentDidMount() {
    this.setState({ allowAnom: this.props.allowAnom || false })
    const editorOptions = {
      showEmbededSurveyTab: false,
      showPropertyGrid: false,
      showPagesToolbox: true,
      useTabsInElementEditor: true,
      showJSONEditorTab: true,
      questionTypes: [
        'text',
        'checkbox',
        'radiogroup',
        'dropdown',
        'boolean',
        'matrix',
        'matrixdynamic',
        'imagepicker',
        'comment',
        'expression',
        'multipletext',
      ],
    }
    this.editor = new SurveyJSEditor.SurveyEditor('editorElement', editorOptions)
    this.editor.haveCommercialLicense = true
    this.editor.isAutoSave = true
    this.editor.saveSurveyFunc = this.saveMySurvey
    this.editor.text = this.props.config || ''
  }

  render() {
    const publishedVersion = this.props.surveys.find(survey => survey.key === this.props.configKey)
    const publishedTime = publishedVersion ? new Date(publishedVersion.lastUpdate) : undefined
    return (
      <div className="tableContainer">
        <div className="headerRow">
          <h2 className="boxTitle">{t('editor')}</h2>
          {publishedTime ? (
            <p className="publishedTime">
              {t('last_published', { time: publishedTime.toLocaleString() })}
            </p>
          ) : null}
          <div className="flex" />
          <button
            className="deleteButton"
            onClick={() => this.props.deleteSurvey(this.props.history)}
          >
            {t('delete')}
          </button>
          <button
            className="dd-bordered"
            onClick={() => this.props.showHomePage(this.props.history)}
          >
            {t('done')}
          </button>
        </div>
        <div className="editorBox">
          {this.props.isEditorBoxDisplay && <div id="editorElement" />}
        </div>
        <div className="settingsContainer">
          <p className="boxTitleBold">{t('allow_anom')}</p>
          <CheckIcon
            allowAnom={this.state.allowAnom}
            offApprove={this.reSaveOff}
            onApprove={this.reSaveOn}
          />
        </div>
      </div>
    )
  }

  reSaveOn = () => {
    const allowAnom = true
    if (allowAnom !== this.state.allowAnom) {
      this.setState({ allowAnom })
      this.props.saveConfig(this.editor.text, true)
    }
  }

  reSaveOff = () => {
    const allowAnom = false
    if (allowAnom !== this.state.allowAnom) {
      this.setState({ allowAnom })
      this.props.saveConfig(this.editor.text, false)
    }
  }

  saveMySurvey = () => {
    const { allowAnom } = this.state
    this.props.saveConfig(this.editor.text, allowAnom)
  }
}

export default SurveyEditor

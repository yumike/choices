define 'choices/views/view', [
  'chaplin/views/view'
], (ChaplinView) ->

  class View extends ChaplinView

    getTemplateFunction: ->
      return unless @template?
      if not Handlebars.templates? or @template not of Handlebars.templates
        throw new Error "Template '#{@template}' does not exist."
      Handlebars.templates[@template]

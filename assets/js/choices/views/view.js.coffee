define 'choices/views/view', [
  'chaplin/views/view'
], (ChaplinView) ->

  class View extends ChaplinView

    renderedSubviews: false

    renderSubviews: ->
      return

    render: ->
      super
      unless @renderedSubviews
        @renderSubviews()
        @renderedSubviews = true
      this

    templateExists: ->
      Handlebars.templates? and @template of Handlebars.templates

    getTemplateFunction: ->
      return unless @template?
      unless @templateExists
        throw new Error "Template '#{@template}' does not exist."
      Handlebars.templates[@template]

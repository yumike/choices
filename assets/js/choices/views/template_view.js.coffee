# Template view is rendered using Handlebars template. Template name can be
# specified in two ways:
#   - using `template` attribute in sub-class
#   - using `template` option in `initialize` method
class Choices.TemplateView extends Backbone.View

  # This method is overriden to attach `template` option directly to the view
  # without `super` in `initialize` method of sub-class.
  _configure: (options) ->
    super
    @template = @options.template if "template" of @options

  # Sets rendered template as HTML of view element
  render: =>
    @$el.html @renderTemplate @getTemplateContext()
    this

  renderTemplate: (context) ->
    if not Handlebars.templates? or @template not of Handlebars.templates
      throw new Error "Template '#{@template}' does not exist."
    Handlebars.templates[@template] context

  # Your view should override this method in order to return an object, which
  # will be used as template context.
  getTemplateContext: ->
    {}

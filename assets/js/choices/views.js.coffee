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


# Simple view to render item in select list, used by Choices.ListView.
class Choices.ItemView extends Choices.TemplateView
  tagName:   "li"
  className: "item"
  template:  "js/choices/templates/item"

  getTemplateContext: ->
    @model.toJSON()


# View with drop-down list of items to select.
class Choices.ListView extends Backbone.View
  tagName:   "ul"
  className: "choices-list"

  initialize: ->
    @length = 0
    @spinner = $("<li>").addClass("item item-spinner")
    @collectionFactory = @options.collectionFactory

  render: =>
    @renderCollection()
    @enableScrollHandler()
    this

  # Renders a slice of collection
  renderCollection: (start=0) ->
    @showSpinner()
    @collectionFactory start, (collection) =>
      @hideSpinner()
      @addAll collection

  # Appends all models from collection to the end of list
  addAll: (collection) =>
    collection.each @addOne

  # Appends model to the end of list
  addOne: (model) =>
    @length++
    view = new Choices.ItemView model: model
    @$el.append view.render().el

  enableScrollHandler: ->
    @$el.scroll @scrollHandler

  scrollHandler: =>
    @renderCollection @length if @isScrolledToBottom()

  isScrolledToBottom: ->
    @el.scrollHeight - @el.scrollTop == @el.clientHeight

  showSpinner: =>
    @$el.append @spinner

  hideSpinner: =>
    @spinner.detach()

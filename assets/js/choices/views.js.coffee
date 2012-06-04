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
    @spinner = $("<li>").addClass("item item-spinner")
    @collectionFactory = @options.collectionFactory
    @limit = @options.limit ? 25
    @data = @options.data ? {}

  empty: ->
    @length = 0
    @$el.empty()

  render: =>
    @empty()
    @renderCollection()
    @enableScrollHandler()
    this

  # Renders a slice of collection
  renderCollection: ->
    data = _.defaults {start: @length, stop: @length + @limit}, @data
    @showSpinner()
    @collectionFactory data, (collection) =>
      @hideSpinner()
      @addAll collection

  # Appends all models from collection to the end of list
  addAll: (collection) =>
    if collection.length == 0
      @disableScrollHandler()
    else
      collection.each @addOne

  # Appends model to the end of list
  addOne: (model) =>
    @length++
    view = new Choices.ItemView model: model
    @$el.append view.render().el

  enableScrollHandler: ->
    @$el.scroll @scrollHandler

  disableScrollHandler: ->
    @$el.unbind "scroll", @scrollHandler

  scrollHandler: =>
    @renderCollection() if @isScrolledToBottom()

  isScrolledToBottom: ->
    @el.scrollHeight - @el.scrollTop == @el.clientHeight

  showSpinner: =>
    @$el.append @spinner

  hideSpinner: =>
    @spinner.detach()

  updateData: (data) ->
    @data = _.extend @data, data
    @render()


class Choices.SearchView extends Choices.TemplateView
  className: "choices-search"
  template:  "js/choices/templates/search"

  events:
    "keyup input":   "keyup"
    "keydown input": "keydown"

  initialize: ->
    @value = ""

  keyup: (event) =>
    clearTimeout @timeoutId if @timeoutId?
    @timeoutId = setTimeout @triggerChange, 300

  keydown: (event) =>
    if event.which == 13
      clearTimeout @timeoutId if @timeoutId?
      @triggerChange()

  triggerChange: =>
    newValue = $("input").val()
    if newValue != @value
      @value = newValue
      @trigger "change", @value


class Choices.DropdownView extends Backbone.View
  className: "choices-dropdown"

  initialize: ->
    @searchView = new Choices.SearchView
    @searchView.on "change", @changeValue

    @listView = new Choices.ListView collectionFactory: @options.collectionFactory

  render: =>
    @$el.append @searchView.render().el
    @$el.append @listView.render().el
    this

  changeValue: (value) =>
    @listView.updateData {query: value}

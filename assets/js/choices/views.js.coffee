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
  className: "choices__item"
  template:  "js/choices/templates/item"

  initialize: ->
    @list = @options.list
    @$el.hover @enter, @leave
    @$el.click @select

  getTemplateContext: ->
    @model.toJSON()

  enter: =>
    @$el.addClass "choices__item_hover"

  leave: =>
    @$el.removeClass "choices__item_hover"

  select: =>
    @list.set selected: @model


# View with drop-down list of items to select.
class Choices.ListView extends Backbone.View
  tagName:   "ul"
  className: "choices__list"

  initialize: ->
    @spinner = $("<li>").addClass("choices__spinner")
    @collectionFactory = @options.collectionFactory
    @limit = @options.limit ? 25

    @list = @options.list
    @list.data.on "change", @render

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
    data = _.defaults {start: @length, stop: @length + @limit}, @list.data.toJSON()
    @showSpinner()
    @collectionFactory data, (collection) =>
      @hideSpinner()
      @addAll collection

  # Appends all models from collection to the end of list
  addAll: (collection) =>
    @disableScrollHandler() if collection.length < @limit
    collection.each @addOne

  # Appends model to the end of list
  addOne: (model) =>
    @length++
    view = new Choices.ItemView model: model, list: @list
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


class Choices.SearchView extends Choices.TemplateView
  className: "choices__search"
  template:  "js/choices/templates/search"

  events:
    "keyup input":   "keyup"
    "keydown input": "keydown"

  initialize: ->
    @list = @options.list

  keyup: (event) =>
    clearTimeout @timeoutId if @timeoutId?
    @timeoutId = setTimeout @change, 300

  keydown: (event) =>
    if event.which == 13
      clearTimeout @timeoutId if @timeoutId?
      @change()

  change: =>
    @list.data.set query: @$("input").val()


class Choices.DropdownView extends Backbone.View
  className: "choices__dropdown"

  initialize: ->
    @list = @options.list
    @searchView = new Choices.SearchView list: @list
    @listView = new Choices.ListView list: @list, collectionFactory: @options.collectionFactory
    @list.on "change:isActive", @toggle

  render: =>
    @$el.append @searchView.render().el
    @$el.append @listView.render().el
    this

  show: ->
    @$el.show()
    $(document).on "mouseup", @hideIfOutside

  hide: ->
    @$el.hide()
    $(document).off "mouseup", @hideIfOutside

  hasNot: (el) ->
    not @$el.is(el) and @$el.has(el).length == 0

  hideIfOutside: (event) =>
    @list.set(isActive: false) if @hasNot event.target

  toggle: =>
    if @list.get("isActive") then @show() else @hide()


class Choices.SelectedItemView extends Choices.TemplateView
  className: "choices__selected-item"
  template:  "js/choices/templates/selected_item"

  initialize: ->
    @list = @options.list
    @list.on "change:selected", @render
    @list.on "change:isActive", @toggleClickability
    @$el.on "mouseup", @activate

  getTemplateContext: ->
    selected = @list.get("selected")
    if selected? then selected.toJSON() else {}

  toggleClickability: =>
    if @list.get "isActive"
      @$el.off "mouseup", @activate
    else
      @$el.on "mouseup", @activate

  activate: (event) =>
    event.stopPropagation()
    @list.set isActive: true


class Choices.SelectView extends Backbone.View
  className: "choices"

  initialize: ->
    @list = new Choices.List
    @selectedItemView = new Choices.SelectedItemView list: @list
    @dropdownView = new Choices.DropdownView list: @list, collectionFactory: @options.collectionFactory

  render: =>
    @$el.append @selectedItemView.render().el
    @$el.append @dropdownView.render().el
    this

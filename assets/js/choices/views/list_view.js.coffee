define 'choices/views/list_view', [
  'jquery'
  'underscore'
  'choices/views/view'
  'choices/views/item_view'
], ($, _, View, ItemView) ->

  # View with drop-down list of items to select.
  class ListView extends View
    tagName:   "ul"
    className: "choices__list"

    initialize: ->
      super
      @spinner = $("<li>").addClass("choices__spinner")
      @collectionFactory = @options.collectionFactory
      @limit = @options.limit ? 25

      @list = @options.list
      @list.data.on "change", @render

    empty: ->
      @length = 0
      @$el.empty()

    render: ->
      super
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
      view = new ItemView model: model, list: @list
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

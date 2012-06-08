define 'choices/views/dropdown_view', [
  'jquery'
  'choices/views/view'
  'choices/views/list_view'
  'choices/views/search_view'
], ($, View, ListView, SearchView) ->

  class DropdownView extends View
    className:  "choices__dropdown"
    autoRender: true

    initialize: ->
      super
      @list = @options.list
      @list.on "change:isActive", @toggle
      @collectionFactory = @options.collectionFactory

    renderSubviews: ->
      @subview new SearchView list: @list, container: @el
      @subview new ListView list: @list, collectionFactory: @collectionFactory, container: @el

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

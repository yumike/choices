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

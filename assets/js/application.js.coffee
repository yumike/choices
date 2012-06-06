class Clients extends Backbone.Collection
  url: "/clients"

  parse: (response) ->
    response.objects

require [
  'choices/views/select_view'
], (SelectView) ->
  clientsFactory = (data, callback) ->
    clients = new Clients
    clients.fetch data: data, success: callback

  jQuery ->
    view = new SelectView collectionFactory: clientsFactory
    $("#application").append view.render().el

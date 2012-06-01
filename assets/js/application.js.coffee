class Clients extends Backbone.Collection
  url: "/clients"

  parse: (response) ->
    response.objects

clientsFactory = (start, callback) ->
  clients = new Clients
  clients.fetch data: {_start: start, _stop: start + 50}, success: callback

jQuery ->
  view = new Choices.ListView collectionFactory: clientsFactory
  $("#application").append view.render().el

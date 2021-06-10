# TODO: Remove callback everywhere

class InMemoryStore
  # TODO: Make domainEventSequence private but allow to request it to access the store directly if needed
  domainEventSequence:
    currentDomainEventId: 1


  constructor: ->
    @_domainEvents = []


  initialize: (@_context) ->
    new Promise (resolve) =>
      @_domainEventsCollectionName = "#{@_context.name}.DomainEvents"
      resolve()


  saveDomainEvent: (domainEvent) ->
    new Promise (resolve) =>
      # TODO: we should not modify input arguments in order to keep the code side effects free
      domainEvent.id = @domainEventSequence.currentDomainEventId++
      @_domainEvents.push domainEvent
      resolve domainEvent


  findDomainEventsByName: (domainEventNames, callback) ->
    domainEventNames = [domainEventNames] if domainEventNames not instanceof Array
    events = @_domainEvents.filter (domainEvent) ->
      domainEventNames.indexOf(domainEvent.name) > -1
    callback null, events


  findDomainEventsByAggregateId: (aggregateIds, callback) ->
    aggregateIds = [aggregateIds] if aggregateIds not instanceof Array
    domainEvents = @_domainEvents.filter (domainEvent) ->
      aggregateIds.indexOf(domainEvent.aggregate.id) > -1
    callback null, domainEvents


  findDomainEventsByNameAndAggregateId: (domainEventNames, aggregateIds, callback) ->
    domainEventNames = [domainEventNames] if domainEventNames not instanceof Array
    aggregateIds = [aggregateIds] if aggregateIds not instanceof Array
    domainEvents = @_domainEvents.filter (domainEvent) ->
      domainEventNames.indexOf(domainEvent.name) > -1 and aggregateIds.indexOf(domainEvent.aggregate.id) > -1
    callback null, domainEvents


  destroy: ->
    return Promise.resolve()


module.exports = InMemoryStore

// JSR223 PostProcessor — attach to GET API /api/screeners/swan_adhd_parent
def body = prev.getResponseDataAsString()
if (body == null || body.isEmpty()) {
    throw new IllegalStateException('SWAN definition GET returned empty body')
}
props.put('SWAN_DEFINITION_JSON', body)

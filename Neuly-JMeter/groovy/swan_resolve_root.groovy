// Ensures props neuly_jmeter_root is set (GUI runs, -J override, or UDV).
def normalize = { String p ->
    if (p == null || p.isEmpty()) return null
    def n = p.replace('\\', '/')
    return n.endsWith('/') ? n : n + '/'
}
def root = normalize(props.get('neuly_jmeter_root') as String)
if (root == null) {
    root = normalize(vars.get('neuly_jmeter_root') as String)
}
if (root == null) {
    def base = org.apache.jmeter.services.FileServer.getFileServer().getBaseDir()
    def f = new File(base)
    if (f.isDirectory() && new File(f, 'groovy/swan_build_report_payload.groovy').isFile()) {
        root = normalize(f.getAbsolutePath())
    }
}
if (root != null) {
    props.put('neuly_jmeter_root', root)
}

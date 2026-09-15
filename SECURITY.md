# Security Policy

## Supported versions

This project is at v0.1.x. There is one supported line: the latest published version on npm. Fixes land as a new patch/minor release, not backports.

## Reporting a vulnerability

Please **do not open a public issue** for a security report. Use GitHub's private vulnerability reporting instead:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.

This opens a private advisory visible only to you and the maintainer, so the report and any discussion stay off the public issue tracker until a fix is ready.

You should get an initial response within a few days. If a report turns out to be a real vulnerability, I'll credit you in the advisory (unless you'd rather stay anonymous) once a fix is published.

## Dependency policy

Runtime dependencies are kept minimal deliberately, and this project has already turned one down for a specific security reason rather than silently accepting it: the obvious way to extract a component's WIT interface from a `.wasm` binary is through `@bytecodealliance/jco`, whose dependency tree currently pulls in a critical-severity Zip Slip vulnerability several layers down. Rather than add that to this tool's `node_modules`, `wit-breaking` takes WIT *text* as input and has **zero runtime dependencies** -- pipe the output of the official `wasm-tools component wit` extractor into it instead. Full detail in the README's design-tradeoffs section.

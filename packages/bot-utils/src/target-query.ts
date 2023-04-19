

export interface TargetQuery {
    target: string
    from: string
    resolver: string
}

const commandsWithResolver = new Set(['dns', 'http',]);

export function parseTargetQuery(cmd: string | undefined, args: string[]): TargetQuery {
    const targetQuery = {} as TargetQuery;

    if (!cmd || args.length === 0) {
        return targetQuery;
    }

    const [resolver, argsWithoutResolver] = findAndRemoveResolver(args);
    if (resolver !== '') {
        // resolver was found
        if (!commandsWithResolver.has(cmd)) {
            throw new Error(`command ${cmd} does not accept a resolver argument. @${resolver} was provided`);
        }

        targetQuery.resolver = resolver;
    }

    targetQuery.target = argsWithoutResolver[0] ? String(argsWithoutResolver[0]) : '';

    if (argsWithoutResolver.length > 1) {
        if (argsWithoutResolver[1] === 'from') {
            targetQuery.from = argsWithoutResolver.slice(2).join(' ').trim().toLowerCase();
        } else {
            throw new Error('invalid command format');
        }
    }

    return targetQuery;
}

export function findAndRemoveResolver(args: string[]): [string, string[]] {
    let resolver = '';
    let resolverIndex = -1;

    for (const [i, arg] of args.entries()) {
        if (arg.length > 0 && arg[0] === '@') {
            resolver = arg.slice(1);
            resolverIndex = i;
            break;
        }
    }

    if (resolverIndex === -1) {
        // resolver was not found
        return ['', args];
    }

    const argsWithoutResolver: string[] = [...args];
    argsWithoutResolver.splice(resolverIndex, 1);

    return [resolver, argsWithoutResolver];
}
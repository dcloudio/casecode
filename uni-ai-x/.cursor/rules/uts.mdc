---
description: UTS, or Uni Type Script, is a cross-platform, high-performance, strongly-typed modern programming language
globs: *.uts,*.ts
alwaysApply: false
---

### Core
The code running environment is customized ts, and the type requirements are strictly similar to Kotlin. Any is not allowed for types.
You cannot use dynamic objects. Only Map. All types must be explicitly declared, and implicit type conversions are not allowed.
Don't write types directly in the code, define them at the top and then use them. Types are not allowed to be too deep, so write a separate one to refer to them.
When determining if, the value inside must be of type boolean, and no other type should be used.
For example: If the value of aNull is null, it is wrong to write if (aNull), and must be written as if (aNull != null)。
Optional properties must use?. Use non-null assertion!,? Can be regarded as an empty decision.
Do not use === and!==, Only == and!=

### Type System Specifications
- Force explicit declaration of variable/function types (except for simple literals), giving preference to using interfaces to define complex data structures. Union types need to explicitly declare null (such as string| null), prohibiting the use of any type. Support secure chain calls (?.) Handle optional values.
- Static typing: UTS emphasizes static typing, requiring all variables and function parameters to have clear type declarations, avoiding the use of any type.
- Type system: UTS does not support a structured type system, but adopts a nominal type system, emphasizing type names and inheritance relationships to ensure type safety.
- Core language features: UTS does not support undefined, variable promotion, var keywords, etc., and requires conditional statements to use boolean types.
- Type system dependent: UTS does not support conditional types, mapping types, utility types, as const assertions, etc.
- Classes and objects are related: UTS does not support private fields starting with #, dynamic field access, static blocks, using classes as objects, etc.
- Function dependence: UTS does not support types with call signatures and construct signatures, constructor types, function declarations used as values, etc.
- Modules and namespaces: UTS does not support namespaces, require and import assignment expressions, export =... grammar, etc.
- Type checking and conversion: UTS does not support the is operator and requires the use of instanceof and as for type protection.
- Special language features: UTS does not support Symbol(), index signature, declaration merge, generator functions, JSX expressions, with statements, globalThis, etc.
- Operators and expressions: UTS limits the use of unary operators and prohibits the use of delete and comma operators.
- Prototypes and object manipulation: UTS does not support assigning values on prototypes.
- Adaptation suggestions:
- Use TypeScript type annotations to clarify type information.
- Use classes and interfaces to define type structures.
- Use instanceof and as for type protection.
- Use static initializations or constructors to implement the functionality of static blocks.
- Use modules to organize code.

### variable management
- let is used for variable variables, and var is disabled to avoid platform differences (such as the conflict between let and UTSlet in Swift)
Variable naming follows the hump pattern, prohibits the beginning of numbers, and supports underscore separators
- Variables must be typed when they are initialized or declared

### Cross-platform adaptation rules
Use conditional compilation instructions (such as #ifdef ANDROID) to handle platform differences and disable platform-specific syntax (such as Kotlin's when)
Avoid directly manipulating DOM/BOM and use Uni APIs first (such as uni.request)

### Adaptation suggestions
- Use TypeScript type annotations to clarify type information.
- Use classes and interfaces to define type structures.
- Use instanceof and as for type protection.
- Use static initializations or constructors to implement the functionality of static blocks.
- Use modules to organize code.

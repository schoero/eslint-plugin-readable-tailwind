import { getUnknownClasses } from "./unknown-classes.async.v4.js";

import type { CanonicalClasses, CanonicalClassOptions } from "./canonical-classes.js";


export function getCanonicalClasses(tailwindContext: any, classes: string[], options: CanonicalClassOptions): CanonicalClasses {
  const result: CanonicalClasses = {};

  if(typeof tailwindContext?.canonicalizeCandidates !== "function"){
    for(const className of classes){
      result[className] = {
        input: [className],
        output: className
      };
    }
    return result;
  }

  type CanonicalizeCandidates = (candidates: string[], options: CanonicalClassOptions) => string[];

  const canonicalizeCandidates: CanonicalizeCandidates = (candidates, candidateOptions) => tailwindContext.canonicalizeCandidates(candidates, candidateOptions);

  // tailwind currently crashes when unknown classes are passed to canonicalizeCandidates
  const unknownClasses = getUnknownClasses(tailwindContext, classes);
  const unknownClassSet = new Set(unknownClasses);
  const knownClasses = classes.filter(className => !unknownClassSet.has(className));

  const canonicalizedClasses = canonicalizeCandidates(knownClasses, options);
  const canonicalizedClassSet = new Set(canonicalizedClasses);
  const inputClassSet = new Set(classes);

  const removedClasses = knownClasses.filter(className => !canonicalizedClassSet.has(className));
  const originalClasses = knownClasses.filter(className => canonicalizedClassSet.has(className));
  const canonicalClasses = canonicalizedClasses.filter(className => !inputClassSet.has(className));

  for(const originalClass of originalClasses){
    result[originalClass] = {
      input: [originalClass],
      output: originalClass
    };
  }

  for(const unknownClass of unknownClasses){
    result[unknownClass] = {
      input: [unknownClass],
      output: unknownClass
    };
  }

  if(canonicalClasses.length === 0){
    return result;
  }

  const subsetCanonicalizations = removedClasses.map(removedClass => {
    const subset = removedClasses.filter(className => className !== removedClass);

    return new Set(canonicalizeCandidates(subset, options));
  });

  for(const canonicalClass of canonicalClasses){
    const necessaryClasses = removedClasses.filter((_, index) => !subsetCanonicalizations[index].has(canonicalClass));

    for(const originalClass of necessaryClasses){
      result[originalClass] = {
        input: necessaryClasses,
        output: canonicalClass
      };
    }
  }

  return result;
}

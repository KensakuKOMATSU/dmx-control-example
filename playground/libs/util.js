export function areObjectsEqual(obj1, obj2) {
  // 参照が同じならtrue
  if (obj1 === obj2) {
    return true;
  }

  // どちらかがnullまたは異なる型ならfalse
  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // プロパティの数が異なる場合はfalse
  if (keys1.length !== keys2.length) {
    return false;
  }

  // すべてのプロパティを再帰的に比較
  for (const key of keys1) {
    if (!keys2.includes(key) || !areObjectsEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

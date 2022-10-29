export interface TreeNodeFlat<T> {
  value: T;
  level: number;
  isLeaf: boolean;
  isVisible: boolean;
}

export interface TreeNode<T> extends TreeNodeFlat<T> {
  children: TreeNode<T>[];
  parent: TreeNode<T> | null;
  isVisible: boolean;
}

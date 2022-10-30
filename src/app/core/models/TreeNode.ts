export interface TreeNodeFlat<T> {
  value: T;
  level: number;
  isLeaf: boolean;
  isVisible: boolean;
  /**
   * This one is NOT present on BE.
   * So you need to set it explicitly on FE when handling data
   * Angular NEEDS it more than air it breathes because it's too stupid to know
   * what to actually rerender (this is normal though for lists and treelists)
   * Having Id as trackByIdentifier would be ok in most cases,
   * EXCEPT when you're adding children to a parent Node in treelist
   * In that specific case, parent Node also needs to rerender
   * in order to correctly show or hide matTreeNodeToggle
   * If you don't change trackByIdentifier, Angular DOES NOT rerender the node,
   * hence not adding, or removing, toggle button
   * The identifier itself does not carry any real information, which is why it can be a guid or math.random
   * It COULD be Id + Children.count but guid is easier to use
   * New Nodes don't have a valid Id anyways and you have to create Guid for them to be unique in that case so it fits ok
   * Also, this has to be a value type, because having an object type would mean a new reference every time and rerender every time
   */
  trackByIdentifier?: string;
}

export interface TreeNode<T> extends TreeNodeFlat<T> {
  children: TreeNode<T>[];
  parent: TreeNode<T> | null;
  isVisible: boolean;
}

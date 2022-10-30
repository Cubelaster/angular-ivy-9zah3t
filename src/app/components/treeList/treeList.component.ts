import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeNestedDataSource,
} from '@angular/material/tree';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ActionButton } from '../../core/models/ActionButton';
import { TreeNode, TreeNodeFlat } from '../../core/models/TreeNode';

@Component({
  selector: 'tree-list',
  templateUrl: './treeList.component.html',
  styleUrls: ['./treeList.scss'],
})
/**
 * Here be dragons
 * Don't touch this unless you REALLY need to
 * Yeah, that was some time ago
 * Now it's even worse
 */
export class TreeList<T> implements OnChanges {
  //#region Ctors and Members

  /**
   * Not used at the moment
   */
  @Input() mode: 'flat' | 'nested' = 'flat';
  @Input() hasCheckbox = false;
  @Input() isEditable = false;
  @Input() treeData: Array<TreeNode<T>> = [];
  @Input() initialSelection: Array<T> = [];
  @Input('nodeDisplayTemplate')
  nodeDisplayTemplateRef: TemplateRef<any>;
  /**
   * Used in combination with checkboxes
   * When you need to toggle all the same onse at the same time
   */
  @Input() duplicatesFinder: (
    node: Array<TreeNodeFlat<T>>,
    array: Array<TreeNodeFlat<T>>
  ) => Array<TreeNodeFlat<T>>;
  /**
   * Function used when you enable filtering
   */
  @Input() filterFunction: (e: T, searchQuery: string) => boolean;
  /**
   * Function used when you enable edit mode
   * This determines what gets added on New
   */
  @Input() defaultItemGenerator: (parent?: TreeNode<T>) => T;
  /**
   * Equality comparator is similar to duplicateFinder
   * When Edit mode is enabled, this function takes care of finding
   * correct node to delete or add/delete children from
   */
  @Input() equalityComparator: (item1: T, item2: T) => boolean;
  /**
   * Used for track by
   * This is important when you're trying to add or delete nodes
   * Because Ng can't track them correctly, because ofcourse it uses shallow compare or reference compare which just isn't right
   */
  @Input() uniquenessComparator: (item: T) => any;
  private searchFilter: Subject<string> = new Subject<string>();
  public actionButtons: Array<ActionButton>;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TreeNodeFlat<T>, TreeNode<T>>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TreeNode<T>, TreeNodeFlat<T>>();

  /** A selected parent node to be inserted */
  selectedParent: TreeNodeFlat<T> | null = null;

  treeControl: FlatTreeControl<TreeNodeFlat<T>>;
  nestedTreeControl: NestedTreeControl<TreeNode<T>>;

  treeFlattener: MatTreeFlattener<TreeNode<T>, TreeNodeFlat<T>>;

  dataSource: MatTreeFlatDataSource<TreeNode<T>, TreeNodeFlat<T>>;
  treeSource: MatTreeNestedDataSource<TreeNode<T>>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TreeNodeFlat<T>>(true /* multiple */);

  constructor() {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );

    this.treeControl = new FlatTreeControl<TreeNodeFlat<T>>(
      this.getLevel,
      this.isExpandable
    );
    this.nestedTreeControl = new NestedTreeControl<TreeNode<T>>(
      (e) => e.children
    );

    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );
    this.treeSource = new MatTreeNestedDataSource<TreeNode<T>>();

    this.searchFilter
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (value && value.length >= 2) {
          this.filter(value);
        } else {
          this.clearFilter();
        }
      });
  }

  //#endregion Ctors and Members

  //#region NgLifecycle

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('treeData') && changes.treeData.currentValue) {
      this.dataSource.data = changes.treeData.currentValue;
      this.treeSource.data = changes.treeData.currentValue;
    }

    if (
      changes.hasOwnProperty('initialValues') &&
      changes.initialValues.currentValue
    ) {
      this.initialSelection = changes.initialValues.currentValue;
    }

    if (this.isEditable && this.defaultItemGenerator) {
      this.actionButtons = [{ actionMethod: this.new, localizationKey: 'New' }];
    }

    if (this.dataSource.data && this.initialSelection && this.hasCheckbox) {
      // Only value is important
      const treeInitialValues = this.initialSelection.map((value: T) => {
        return {
          isLeaf: true,
          level: 0,
          value,
        } as TreeNodeFlat<T>;
      });

      this.toggleAllSame(treeInitialValues, 'selected');
    }
  }

  //#endregion NgLifecycle

  //#region TreeHelpersImplementations

  getLevel = (node: TreeNodeFlat<T>): number => node.level;

  // The when section in html is basically an if that displays for first true and ignores everything else
  // So now we need to override most stuff here because I can't hide a node based on a single
  // property but instead I need to do magic
  isExpandable = (node: TreeNodeFlat<T>): boolean => !node.isLeaf;

  getChildren = (node: TreeNode<T>): TreeNode<T>[] => node.children;

  // Really should've been _nodeData.children BUT that way we would lose lightweightness
  // and be forced to have parent <=> child relationship everywhere
  hasChild = (_: number, _nodeData: TreeNodeFlat<T>): boolean =>
    !_nodeData.isLeaf;

  hasChildAndIsVisible = (_: number, _nodeData: TreeNodeFlat<T>): boolean =>
    !_nodeData.isLeaf && _nodeData.isVisible;

  hasNoContent = (_: number, _nodeData: TreeNodeFlat<T>): boolean =>
    !Boolean(_nodeData.level);

  isHidden = (_: number, _nodeData: TreeNodeFlat<T>): boolean =>
    !_nodeData.isVisible;

  trackBy = (_: number, _nodeData: TreeNodeFlat<T>): any =>
    this.uniquenessComparator
      ? this.uniquenessComparator(_nodeData.value)
      : _nodeData.value;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TreeNode<T>, level: number): TreeNodeFlat<T> => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.value === node.value
        ? existingNode
        : ({} as TreeNodeFlat<T>);
    flatNode.value = node.value;
    flatNode.level = level;
    flatNode.isLeaf = node.isLeaf;
    flatNode.isVisible = node.isVisible;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /**
   *
   * @returns A List of Nodes for further manipulation
   */
  flatNodeMapToArray = (): Array<TreeNodeFlat<T>> => {
    const valuesArray = [];
    for (const entry of this.flatNodeMap.entries()) {
      valuesArray.push(entry[0]);
    }
    return valuesArray;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TreeNodeFlat<T>): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });

    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TreeNodeFlat<T>): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    const descendantsNotAllSelected = !this.descendantsAllSelected(node);

    return result && descendantsNotAllSelected;
  }

  descendantsAllNotSelected(node: TreeNodeFlat<T>): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllNotSelected =
      descendants.length === 0 ||
      descendants.every((child) => {
        return !this.checklistSelection.isSelected(child);
      });
    return descAllNotSelected;
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  treeNodeSelectionToggle(node: TreeNodeFlat<T>): void {
    const isPartiallySelected = this.descendantsPartiallySelected(node);
    const newMode =
      this.checklistSelection.isSelected(node) && !isPartiallySelected
        ? 'deselected'
        : 'selected';

    const descendants = this.treeControl.getDescendants(node);
    if (this.duplicatesFinder) {
      this.toggleAllSame([...descendants, node], newMode);
    } else {
      // Force update for the parent
      descendants.forEach((child) => {
        this.checklistSelection.isSelected(child);
        this.checkAllParentsSelection(child);
      });
      this.checkAllParentsSelection(node);
    }
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  treeNodeLeafItemSelectionToggle(node: TreeNodeFlat<T>): void {
    this.checklistSelection.toggle(node);
    const mode = this.checklistSelection.isSelected(node)
      ? 'selected'
      : 'deselected';

    if (this.duplicatesFinder) {
      this.toggleAllSame([node], mode);
    } else {
      this.checklistSelection.isSelected(node);
      this.checkAllParentsSelection(node);
    }
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TreeNodeFlat<T>): void {
    let parent: TreeNodeFlat<T> | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TreeNodeFlat<T>): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /**
   * Get the parent node of a node
   * The TreeNodeFlat does NOT contain information about children or parents.
   * You can see what it does inside transformer function
   * transformer function removes references from node value for lightweight experience
   * That serves the purpose of having isolated values for whatever you need without references to parents or children
   */
  getParentNode(node: TreeNodeFlat<T>): TreeNodeFlat<T> | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /**
   * So, this is the one where we are looking for a Parent node as reference which we can use
   * for filtering, searching and reference matching with node list.
   * For instance, when handling delete or add, this is the one you want, since getParentNode looks through lightweight list
   * @param node Node whose parent we want to find
   * @returns Parent if any, otherwise null
   */
  getParentNodeReference = (node: TreeNode<T>): TreeNode<T> | null => {
    const parentOfNode = this.flatNodeMap.get(
      this.flatNodeMapToArray().find((e) =>
        this.equalityComparator(node.parent as any, e as any)
      )
    );

    return parentOfNode;
  };

  visitNode = (
    nodes: Array<TreeNodeFlat<T>>,
    allNodes: Array<TreeNodeFlat<T>>
  ): void => {
    nodes.forEach((node) => {
      allNodes.push(node);
      if (node.isLeaf) {
        return;
      } else {
        const descendants = this.treeControl.getDescendants(node);
        this.visitNode(descendants, allNodes);
      }
    });
  };

  toggleAllSame = (
    nodes: Array<TreeNodeFlat<T>>,
    mode: 'selected' | 'deselected'
  ): void => {
    let duplicates = this.duplicatesFinder(nodes, this.treeControl.dataNodes);
    this.visitNode(duplicates, duplicates);
    duplicates = [...duplicates.filter(this.onlyUnique)];

    // Handle all the leaves first
    if (mode === 'selected') {
      this.checklistSelection.select(...duplicates);
    } else {
      this.checklistSelection.deselect(...duplicates);
    }

    duplicates.forEach((d) => {
      this.checklistSelection.isSelected(d);
      this.checkAllParentsSelection(d);
    });
  };

  filterChanged(filterEvent: Event): void {
    if (
      filterEvent &&
      filterEvent.target &&
      (filterEvent.target as any).value
    ) {
      this.searchFilter.next((filterEvent.target as any).value);
    } else {
      this.clearFilter();
    }
  }

  filter = (searchQuery: string): void => {
    // Collapse is here to render the change
    this.treeControl.collapseAll();
    this.treeControl.dataNodes.forEach((x) => (x.isVisible = true));
    const filtered = this.flatNodeMapToArray().filter(
      (item: TreeNodeFlat<T>) => !this.filterFunction(item.value, searchQuery)
    );
    filtered.forEach((x) => (x.isVisible = false));
    this.treeControl.expandAll();
  };

  private clearFilter(): void {
    this.treeControl.dataNodes.forEach((x) => (x.isVisible = true));
    this.treeControl.collapseAll();
  }

  onlyUnique = (value, index, self): boolean => {
    return self.indexOf(value) === index;
  };

  //#endregion TreeHelpersImplementations

  //#region API

  public getSelection = (): Array<T> => {
    return this.checklistSelection.selected.map(
      (node: TreeNodeFlat<T>) => node.value
    );
  };

  public getTreeData = (): Array<TreeNode<T>> => this.dataSource.data;

  //#endregion API

  //#region Actions

  getItemActionButtons = (node: TreeNode<T>): Array<ActionButton> => {
    return [
      {
        actionMethod: () => this.new(node),
        localizationKey: 'New',
      },
      {
        actionMethod: () => this.delete(node),
        localizationKey: 'Delete',
      },
    ] as Array<ActionButton>;
  };

  generateGUID = (): string => {
    function s4(): string {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      s4() +
      s4()
    );
  };

  new = (parent?: TreeNode<T>): void => {
    const newItem = this.defaultItemGenerator(parent);

    const newNode = {
      children: [],
      isLeaf: true,
      isVisible: true,
      level: parent?.level ? parent.level + 1 : 0,
      parent,
      trackByIdentifier:
        (parent?.trackByIdentifier ?? '_') + this.generateGUID(),
      value: newItem,
    } as TreeNode<T>;

    if (parent) {
      const realParent = this.flatNodeMap.get(parent);

      realParent.children
        ? (realParent.children = [...realParent.children, newNode])
        : (realParent.children = [newNode]);
      realParent.isLeaf = false; // Important as it subsequently decides which template to use in html
      realParent.trackByIdentifier = this.generateGUID(); // Explicit rerender trigger for treelist, check trackByIdentifier docs

      // Immutability is the keyword
      this.dataSource.data = [...this.dataSource.data];

      this.treeControl.expand(parent);
    } else {
      // Immutability is the keyword
      this.dataSource.data = [...this.dataSource.data, newNode];
    }
  };

  delete = (node: TreeNode<T>): void => {
    const realNode = this.flatNodeMap.get(node);
    const parentOfNode = this.getParentNodeReference(realNode);

    if (parentOfNode) {
      parentOfNode.children = parentOfNode.children.filter(
        (e) => e != realNode
      );
      if (parentOfNode.children.length < 1) {
        parentOfNode.isLeaf = true; // Important as it subsequently decides which template to use in html
        parentOfNode.trackByIdentifier = this.generateGUID(); // Explicit rerender trigger for treelist, check trackByIdentifier docs
        const parent = this.getParentNode(node);
        this.treeControl.expand(parent);
      }
    } else {
      // Immutability is the keyword
      this.dataSource.data = [
        ...this.dataSource.data.filter((e) => e != realNode),
      ];
    }

    this.nestedNodeMap.delete(node);
    this.flatNodeMap.delete(node);

    // Immutability is the keyword
    this.dataSource.data = [...this.dataSource.data];
  };

  //#endregion Actions
}

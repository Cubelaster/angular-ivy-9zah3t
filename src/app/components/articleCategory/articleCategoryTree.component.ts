import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  ArticleCategoryViewModel,
  filter,
  getDefaultArticleCategory,
  getUniqueIdentifier,
} from '../../core/models/ArticleCategory';
import { TreeNode } from '../../core/models/TreeNode';
import { TreeList } from '../treeList/treeList.component';

@Component({
  selector: 'ArticleCategory',
  templateUrl: './articleCategoryTree.component.html',
  styleUrls: ['./articleCategoryTree.scss'],
  host: { '[class.flex-one-column]': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCategoryComponent {
  public articleCategoryTree: Array<TreeNode<ArticleCategoryViewModel>>;
  public articleCategoryTreeFormList: Array<FormGroup> = [];

  @ViewChild('treeChecklistRef', { static: false })
  public treeChecklistComponent: TreeList<ArticleCategoryViewModel>;

  constructor(_cdr: ChangeDetectorRef) {}

  //#region Init/Destroy

  ngOnInit(): void {
    this.initialize();
  }

  ngOnDestroy(): void {}

  //#endregion Init/Destroy

  //#region Initialization

  initialize = async (): Promise<void> => {
    await this.getArticleCategoryTree();
  };

  //#endregion Initialization

  //#region Loaders

  getArticleCategoryTree = async (): Promise<void> => {
    // const response = await firstValueFrom(
    //   this.service.getArticleCategoryTree(this.sharedService.companyId).pipe(
    //     catchError((err) => {
    //       return of<ActionResponse<Array<TreeNode<ArticleCategoryViewModel>>>>(
    //         err.error
    //       );
    //     })
    //   )
    // );
    // if (isSuccessAndHasData(response)) {
    //   this.articleCategoryTree = response.data;
    // } else {
    //   this.sharedService.toastActionResponse(response);
    // }
  };

  //#endregion Loaders

  //#region Logic

  getNextCode = (level: number, parentId?: number): string => {
    let allLevelItems = [...this.articleCategoryTree]
      .filter((e) => e.level === level)
      .filter((e) =>
        parentId
          ? (e.parent as TreeNode<ArticleCategoryViewModel>)?.value?.id ===
            parentId
          : e.parent == null
      );

    return String(
      Math.max(...allLevelItems.map((e) => Number(e.value.code))) + 1
    );
  };

  filterTreeList = (
    item: ArticleCategoryViewModel,
    searchQuery: string
  ): boolean => {
    return filter(item, searchQuery);
  };

  //#region Actions

  generateNewItem = (
    parent?: TreeNode<ArticleCategoryViewModel>
  ): ArticleCategoryViewModel => {
    return getDefaultArticleCategory(
      1,
      this.getNextCode(0),
      parent?.value?.id
    ) as ArticleCategoryViewModel;
  };

  equalityComparator = (
    item1: ArticleCategoryViewModel,
    item2: ArticleCategoryViewModel
  ): boolean =>
    item1 &&
    item2 &&
    item1?.code == item2?.code &&
    item1?.id == item2?.id &&
    item1?.name == item2?.name &&
    item1?.parentId == item2?.parentId &&
    item1?.companyId == item2?.companyId;

  uniqenessComparator = getUniqueIdentifier;

  save = (): void => {
    const newData = this.treeChecklistComponent.getTreeData();
    // Example of data when fetching
    console.log(newData);
  };

  //#endregion Actions

  //#endregion Logic
}

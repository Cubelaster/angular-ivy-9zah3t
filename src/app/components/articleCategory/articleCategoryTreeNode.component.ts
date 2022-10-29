import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ArticleCategoryViewModel } from '../../core/models/ArticleCategory';
import { TreeNode } from '../../core/models/TreeNode';

@Component({
  selector: 'article-category-tree-node',
  templateUrl: './articleCategoryTreeNode.component.html',
})
export class ArticleCategoryTreeNodeComponent implements OnDestroy, OnInit {
  @Input() node: TreeNode<ArticleCategoryViewModel>;
  @Input() formList: Array<FormGroup>;

  public detailsForm: FormGroup;
  public formData: any; // Reactive Forms
  public validationMessages: any; // Reactive Forms
  public formErrors: any = null; // Reactive Forms

  private subscriptions: Subscription = new Subscription();

  constructor(private _cdr: ChangeDetectorRef) {}

  //#region Ng + Lifecycle

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.buildForm();
  }

  detectChanges(): void {
    if (!(this._cdr as ViewRef).destroyed) {
      this._cdr.detectChanges();
    }
  }

  //#endregion Ng + Lifecycle

  //#region Form

  buildForm = (): void => {
    // const formFields: Array<FormDataObject> = [
    //   {
    //     property: 'id',
    //     value: this.node?.value?.id,
    //     ignoreFocus: true,
    //     sizes: getFormColumnSizes(),
    //   },
    //   {
    //     property: 'code',
    //     value: this.node?.value?.code ? String(this.node?.value?.code) : null,
    //     type: 'input',
    //     label: 'common.code',
    //     validators: getCodeValidators(EntityType.ArticleCategory),
    //     sizes: getFormColumnSizes(),
    //   },
    //   {
    //     property: 'name',
    //     label: 'common.denomination',
    //     value: this.node?.value?.name,
    //     type: 'input',
    //     hasTranslation: hasTranslations(EntityType.ArticleCategory),
    //     translationsProps: {
    //       onConfirmAction: this.onTranslationsChanged,
    //     },
    //     validators: [{ name: 'required' }],
    //     sizes: getFormColumnSizes(),
    //   },
    //   {
    //     property: 'translations',
    //     type: 'translation',
    //     value: this.node?.value?.translations ?? {},
    //     ignoreFocus: true,
    //   },
    // ];

    // this.formData = {
    //   formName: this.node
    //     ? this.node.value?.id + '_' + this.node.value?.code
    //     : generateGUID(),
    //   focusFieldCheck: 'code',
    //   formFields,
    // };

    // this.formsService.buildForm(this.formData).then((response: FormBuild) => {
    //   this.detailsForm = response.Form;
    //   this.validationMessages = response.ValidationMessages;
    //   this.formErrors = response.Errors;

    //   this.subscriptions.add(
    //     this.detailsForm.valueChanges.subscribe((data) => {
    //       this.onValueChanged(false);
    //     })
    //   );

    //   this.subscriptions.add(
    //     this.detailsForm.statusChanges.subscribe((data) =>
    //       this.onValueChanged(true)
    //     )
    //   );

    //   this.detectChanges();
    // });

    this.detectChanges();
  };

  // onValueChanged(isStatusChanged: boolean): void {
  //   this.formsService.validateForm(
  //     this.detailsForm,
  //     isStatusChanged,
  //     this.formErrors,
  //     this.validationMessages
  //   );
  // }

  // formFieldKeyDown(event: KeyboardEvent): void {
  //   this.formsService.moveNext(event, this.formData);
  // }

  //#endregion Form
}

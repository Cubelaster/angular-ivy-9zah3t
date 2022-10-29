import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTreeModule } from '@angular/material/tree';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ArticleCategoryComponent } from './components/articleCategory/articleCategoryTree.component';
import { ArticleCategoryTreeNodeComponent } from './components/articleCategory/articleCategoryTreeNode.component';
import { TreeList } from './components/treeList/treeList.component';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatTreeModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  declarations: [
    AppComponent,
    HelloComponent,
    ToolbarComponent,
    TreeList,
    ArticleCategoryComponent,
    ArticleCategoryTreeNodeComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

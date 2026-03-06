import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewContainerRef } from '@angular/core';
import { CustomEditorPlaceholderComponent } from './custom-editor-placeholder.component';
import { HotCellEditorComponent } from './hot-cell-editor.component';

@Component({
  selector: 'hot-mock-custom-editor',
  template: '',
})
class MockCustomEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

describe('CustomEditorPlaceholderComponent', () => {
  let component: CustomEditorPlaceholderComponent;
  let fixture: ComponentFixture<CustomEditorPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CustomEditorPlaceholderComponent,
        MockCustomEditorComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomEditorPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should insert componentRef host view into container', () => {
    const insertSpy = jest.spyOn(component.container, 'insert');
    const mockComponentRef = TestBed.createComponent(
      MockCustomEditorComponent
    ).componentRef;

    fixture.componentRef.setInput('componentRef', mockComponentRef);
    fixture.detectChanges();

    expect(insertSpy).toHaveBeenCalledWith(mockComponentRef.hostView);
  });

  it('should not insert componentRef host view if componentRef is not set', () => {
    const insertSpy = jest.spyOn(component.container, 'insert');

    fixture.componentRef.setInput('componentRef', null);
    fixture.detectChanges();

    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('should have default display value as "none"', () => {
    expect(component.display).toBe('none');
  });

  it('should set display value as "block"', () => {
    fixture.componentRef.setInput('isVisible', true);
    expect(component.display).toBe('block');
  });

  it('should set and get top value', () => {
    fixture.componentRef.setInput('top', 10);
    expect(component.top).toBe(10);
  });

  it('should set and get left value', () => {
    fixture.componentRef.setInput('left', 20);
    expect(component.left).toBe(20);
  });

  it('should set and get height value', () => {
    fixture.componentRef.setInput('height', 30);
    expect(component.height).toBe(30);
  });

  it('should set and get width value', () => {
    fixture.componentRef.setInput('width', 40);
    expect(component.width).toBe(40);
  });

  it('should have a ViewContainerRef for inputPlaceholder', () => {
    expect(component.container).toBeInstanceOf(ViewContainerRef);
  });

  it('should detach editor', () => {
    const detachSpy = jest.spyOn(component.container, 'detach');

    component.detachEditor();

    expect(detachSpy).toHaveBeenCalled();
  });
});

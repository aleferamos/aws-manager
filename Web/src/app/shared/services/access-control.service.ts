import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';

import { AccessRule, canAccessByType } from '../config/access.config';
import { UserInfo, UserService } from './user.service';

export interface AccessControlledItem<TItem> {
  access?: AccessRule;
  children?: TItem[];
}

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private userService = inject(UserService);

  private currentUser: UserInfo | null = null;
  private currentUserRequest$?: Observable<UserInfo>;

  loadCurrentUser(force = false): Observable<UserInfo> {
    if (this.currentUser && !force) {
      return of(this.currentUser);
    }

    if (this.currentUserRequest$ && !force) {
      return this.currentUserRequest$;
    }

    this.currentUserRequest$ = this.userService.getInfo().pipe(
      tap((user) => {
        this.currentUser = user;
      }),
      shareReplay(1),
      finalize(() => {
        this.currentUserRequest$ = undefined;
      }),
    );

    return this.currentUserRequest$;
  }

  canAccess(rule?: AccessRule): Observable<boolean> {
    if (!rule) {
      return of(true);
    }

    return this.loadCurrentUser().pipe(
      map((user) => canAccessByType(user.type, rule)),
      catchError(() => of(false)),
    );
  }

  filterItemsByAccess<TItem extends AccessControlledItem<TItem>>(items: TItem[]): Observable<TItem[]> {
    return this.loadCurrentUser().pipe(
      map((user) => this.filterItems(items, user)),
      catchError(() => of(this.filterItems(items, null))),
    );
  }

  filterItemsWithoutUser<TItem extends AccessControlledItem<TItem>>(items: TItem[]): TItem[] {
    return this.filterItems(items, null);
  }

  private filterItems<TItem extends AccessControlledItem<TItem>>(
    items: TItem[],
    user: UserInfo | null,
  ): TItem[] {
    return items.reduce<TItem[]>((visibleItems, item) => {
      if (!canAccessByType(user?.type, item.access)) {
        return visibleItems;
      }

      const children = item.children ? this.filterItems(item.children, user) : undefined;

      if (item.children && children?.length === 0) {
        return visibleItems;
      }

      visibleItems.push({
        ...item,
        ...(children ? { children } : {}),
      });

      return visibleItems;
    }, []);
  }
}

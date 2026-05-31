from django.urls import path
from django.views.static import serve
from django.conf import settings
import os
from . import views

urlpatterns = [
    # REST API 엔드포인트
    path('api/records/', views.api_records, name='api_records'),
    path('api/records/<int:pk>/', views.api_record_detail, name='api_record_detail'),

    # 기존 SSR 뷰
    path('ssr/',                 views.index,       name='index'),
    path('ssr/create/',          views.create,      name='create'),
    path('ssr/records/',         views.record_list, name='record_list'),
    path('ssr/update/<int:pk>/', views.update,      name='update'),
    path('ssr/delete/<int:pk>/', views.delete,      name='delete'),

    # 정적 프론트엔드 호스팅 (CORS 해결 및 루트 호스팅)
    path('', serve, {'document_root': os.path.join(settings.BASE_DIR, '../front'), 'path': 'start.html'}),
    path('<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, '../front')}),
]
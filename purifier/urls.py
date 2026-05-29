from django.urls import path
from . import views

urlpatterns = [
    path('',                 views.index,       name='index'),
    path('create/',          views.create,      name='create'),
    path('records/',         views.record_list, name='record_list'),
    path('update/<int:pk>/', views.update,      name='update'),
    path('delete/<int:pk>/', views.delete,      name='delete'),
]
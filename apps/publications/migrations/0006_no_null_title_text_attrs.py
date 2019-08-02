# Generated by Django 2.2.4 on 2019-08-02 15:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publications', '0005_auto_20190801_1615'),
    ]

    operations = [
        migrations.AlterField(
            model_name='title',
            name='doi',
            field=models.CharField(blank=True, default='', max_length=250),
        ),
        migrations.AlterField(
            model_name='title',
            name='eissn',
            field=models.CharField(blank=True, default='', help_text='ISSN of electronic version', max_length=9),
        ),
        migrations.AlterField(
            model_name='title',
            name='isbn',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AlterField(
            model_name='title',
            name='issn',
            field=models.CharField(blank=True, default='', max_length=9),
        ),
    ]

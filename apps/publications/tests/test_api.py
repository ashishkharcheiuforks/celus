import pytest
from django.urls import reverse

from core.models import Identity
from logs.models import OrganizationPlatform, AccessLog, Metric
from logs.tests.conftest import report_type_nd
from organizations.models import UserOrganization
from organizations.tests.conftest import organizations
from core.tests.conftest import valid_identity, authenticated_client, authentication_headers,\
    invalid_identity


@pytest.mark.django_db
class TestPlatformAPI(object):

    def test_unauthorized_user(self, client, invalid_identity, authentication_headers,
                               organizations):
        resp = client.get(reverse('platform-list', args=[organizations[0].pk]),
                          **authentication_headers(invalid_identity))
        assert resp.status_code == 403

    def test_authorized_user_no_platforms_no_org(self, authenticated_client, organizations):
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 404

    def test_authorized_user_no_platforms_org(self, authenticated_client, organizations,
                                              valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_accessible_empty_platforms(self, authenticated_client, organizations,
                                                        valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_inaccessible_platforms(self, authenticated_client, organizations,
                                                    platforms, valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_accessible_platforms(self, authenticated_client, organizations,
                                                  platforms, valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]['pk'] == platforms[0].pk

    def test_authorized_user_platforms_in_inaccessible_org(self, authenticated_client,
                                                           organizations, platforms):
        """
        There is an org and it has platforms, but the user cannot access the org
        """
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = authenticated_client.get(reverse('platform-list', args=[organizations[0].pk]))
        assert resp.status_code == 404


@pytest.mark.django_db
class TestPlatformDetailedAPI(object):

    def test_unauthorized_user(self, client, invalid_identity, authentication_headers,
                               organizations):
        resp = client.get(reverse('detailed-platform-list', args=[organizations[0].pk]),
                          **authentication_headers(invalid_identity))
        assert resp.status_code == 403

    def test_authorized_user_no_platforms_no_org(self, authenticated_client, organizations):
        resp = authenticated_client.get(reverse('detailed-platform-list',
                                                args=[organizations[0].pk]))
        assert resp.status_code == 404

    def test_authorized_user_no_platforms_org(self, authenticated_client, organizations,
                                              valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('detailed-platform-list',
                                                args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_accessible_empty_platforms(self, authenticated_client, organizations,
                                                        valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('detailed-platform-list',
                                                args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_inaccessible_platforms(self, authenticated_client, organizations,
                                                    platforms, valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        resp = authenticated_client.get(reverse('detailed-platform-list',
                                                args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_authorized_user_accessible_platforms(self, authenticated_client, organizations,
                                                  platforms, valid_identity):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = authenticated_client.get(reverse('detailed-platform-list',
                                                args=[organizations[0].pk]))
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]['pk'] == platforms[0].pk
        assert resp.json()[0]['title_count'] == 0


@pytest.mark.django_db
class TestPlatformTitleAPI(object):

    def test_unauthorized_user(self, client, invalid_identity, authentication_headers,
                               organizations, platforms):
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = client.get(reverse('platform-title-list',
                                  args=[organizations[0].pk, platforms[0].pk]),
                          **authentication_headers(invalid_identity))
        assert resp.status_code == 403

    def test_authorized_user_no_org(self, authenticated_client, organizations,
                                    platforms):
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = authenticated_client.get(reverse('platform-title-list',
                                                args=[organizations[0].pk, platforms[0].pk]))
        assert resp.status_code == 404

    def test_authorized_user_accessible_platforms_no_titles(
            self, authenticated_client, organizations, platforms, valid_identity, titles):
        """
        Titles are created by the 'titles' fixture, but should not appear in the result as they
        are not accessible for an associated platform
        """
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        UserOrganization.objects.create(user=identity.user, organization=organizations[0])
        OrganizationPlatform.objects.create(organization=organizations[0], platform=platforms[0])
        resp = authenticated_client.get(reverse('platform-title-list',
                                                args=[organizations[0].pk, platforms[0].pk]))
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_authorized_user_accessible_platforms_titles(
            self, authenticated_client, organizations, platforms, valid_identity, titles,
            report_type_nd):
        identity = Identity.objects.select_related('user').get(identity=valid_identity)
        organization = organizations[0]
        platform = platforms[0]
        UserOrganization.objects.create(user=identity.user, organization=organization)
        OrganizationPlatform.objects.create(organization=organization, platform=platform)
        # we need to connect some titles with the platform which is done indirectly through
        # AccessLog instances
        # we create 2 access logs but both for the same title so that we can check that
        # - title is present in the output only once - distinct is used properly
        # - second title is not present - the filtering works OK
        rt = report_type_nd(0)
        metric = Metric.objects.create(short_name='m1', name='Metric1')
        AccessLog.objects.create(platform=platform, target=titles[0], value=1, date='2019-01-01',
                                 report_type=rt, metric=metric)
        AccessLog.objects.create(platform=platform, target=titles[0], value=1, date='2019-02-01',
                                 report_type=rt, metric=metric)
        resp = authenticated_client.get(reverse('platform-title-list',
                                                args=[organization.pk, platform.pk]))
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]['isbn'] == titles[0].isbn
        assert resp.json()[0]['name'] == titles[0].name
